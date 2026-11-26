import PhotosUI
import SwiftUI
import UIKit

struct StagedChatPhoto: Identifiable {
    let id = UUID()
    let image: UIImage
}

struct ChatPhotoLink: Identifiable {
    let url: URL
    var id: String { url.absoluteString }
}

enum StagedSendResult {
    case success
    case failure(remaining: [StagedChatPhoto], caption: String, message: String?)
}

@MainActor
enum ChatPhotoStaging {
    static let maxCount = 10
    /// Matches `coach.uploadPhoto` in server/routers/coach.ts.
    static let maxUploadBytes = 6 * 1024 * 1024

    static func append(
        _ items: [PhotosPickerItem],
        to existing: [StagedChatPhoto]
    ) async -> (photos: [StagedChatPhoto], error: String?) {
        var next = existing
        var failed = 0
        var dropped = 0
        for item in items {
            if next.count >= maxCount {
                dropped += 1
                continue
            }
            do {
                guard let data = try await item.loadTransferable(type: Data.self),
                      let image = UIImage(data: data),
                      let prepared = ImageJPEG.downscaled(image) else {
                    failed += 1
                    continue
                }
                next.append(StagedChatPhoto(image: prepared))
            } catch {
                if !error.isCancellation { failed += 1 }
            }
        }
        let message: String?
        if failed > 0 {
            message = failed == 1 ? "Could not read one photo." : "Could not read \(failed) photos."
        } else if dropped > 0 {
            message = "You can attach up to \(maxCount) photos."
        } else {
            message = nil
        }
        return (next, message)
    }

    /// 1600px long edge, then JPEG 0.7. Nil when the image cannot be encoded or is still over 6 MB.
    static func jpegBase64(from image: UIImage) -> String? {
        guard let data = ImageJPEG.jpegData(image, compressionQuality: 0.7),
              data.count <= maxUploadBytes else { return nil }
        return data.base64EncodedString()
    }
}

@MainActor
enum StagedChatSender {
    /// Sends staged photos in order. Typed text rides on the first photo that sends.
    /// Stops at the first failure and leaves that photo, plus anything not yet sent, in `remaining`.
    static func send(
        photos: [StagedChatPhoto],
        caption: String,
        upload: @MainActor (String) async throws -> String,
        deliver: @MainActor (_ caption: String?, _ mediaURL: String) async -> Bool,
        onProgress: @MainActor ([StagedChatPhoto]) -> Void
    ) async -> StagedSendResult {
        var queue = photos
        var captionLeft = caption
        while !queue.isEmpty {
            let photo = queue[0]
            guard let encoded = ChatPhotoStaging.jpegBase64(from: photo.image) else {
                return .failure(
                    remaining: queue,
                    caption: captionLeft,
                    message: "Could not prepare that photo. It stays attached so you can try again."
                )
            }
            let url: String
            do {
                url = try await upload(encoded)
            } catch {
                let message = error.isCancellation ? nil : error.localizedDescription
                return .failure(remaining: queue, caption: captionLeft, message: message)
            }
            let ok = await deliver(captionLeft.isEmpty ? nil : captionLeft, url)
            guard ok else {
                return .failure(remaining: queue, caption: captionLeft, message: nil)
            }
            captionLeft = ""
            queue.removeFirst()
            onProgress(queue)
        }
        return .success
    }
}

struct StagedChatPhotoStrip: View {
    var photos: [StagedChatPhoto]
    var canRemove: Bool
    var onRemove: (UUID) -> Void

    var body: some View {
        ScrollView(.horizontal, showsIndicators: false) {
            HStack(spacing: 8) {
                ForEach(photos) { photo in
                    ZStack(alignment: .topTrailing) {
                        Image(uiImage: photo.image)
                            .resizable()
                            .scaledToFill()
                            .frame(width: 64, height: 64)
                            .clipShape(RoundedRectangle(cornerRadius: 10, style: .continuous))
                        Button {
                            onRemove(photo.id)
                        } label: {
                            Image(systemName: "xmark.circle.fill")
                                .font(.system(size: 18))
                                .foregroundStyle(HTTheme.forest)
                                .background(Circle().fill(Color.white))
                        }
                        .buttonStyle(.plain)
                        .disabled(!canRemove)
                        .accessibilityLabel("Remove photo")
                        .offset(x: 6, y: -6)
                    }
                    .padding(.top, 8)
                    .padding(.trailing, 8)
                }
            }
            .padding(.horizontal, 2)
        }
    }
}

/// Proposes a square of `maxSide` so a tall photo in a scroll view cannot grow past that cap.
private struct CappedFit: Layout {
    var maxSide: CGFloat

    func sizeThatFits(proposal: ProposedViewSize, subviews: Subviews, cache: inout ()) -> CGSize {
        guard let child = subviews.first else { return .zero }
        let fitted = child.sizeThatFits(ProposedViewSize(width: maxSide, height: maxSide))
        return CGSize(
            width: min(maxSide, fitted.width.isFinite ? max(0, fitted.width) : maxSide),
            height: min(maxSide, fitted.height.isFinite ? max(0, fitted.height) : maxSide)
        )
    }

    func placeSubviews(in bounds: CGRect, proposal: ProposedViewSize, subviews: Subviews, cache: inout ()) {
        subviews.first?.place(
            at: CGPoint(x: bounds.midX, y: bounds.midY),
            anchor: .center,
            proposal: ProposedViewSize(width: bounds.width, height: bounds.height)
        )
    }
}

private struct CappedThumbnail: ViewModifier {
    var maxSide: CGFloat

    func body(content: Content) -> some View {
        CappedFit(maxSide: maxSide) {
            content
        }
    }
}

struct ChatImageThumbnail: View {
    var url: URL
    var onOpen: () -> Void

    var body: some View {
        Button(action: onOpen) {
            AsyncImage(url: url) { phase in
                switch phase {
                case .success(let image):
                    image
                        .resizable()
                        .scaledToFit()
                        .modifier(CappedThumbnail(maxSide: 240))
                case .failure:
                    Image(systemName: "photo")
                        .font(.title3)
                        .foregroundStyle(HTTheme.muted)
                        .frame(width: 120, height: 90)
                default:
                    ProgressView()
                        .frame(width: 120, height: 90)
                }
            }
            .frame(maxWidth: 240, maxHeight: 240)
            .clipShape(RoundedRectangle(cornerRadius: 12, style: .continuous))
        }
        .buttonStyle(.plain)
        .accessibilityLabel("Open photo")
    }
}

struct ChatImageViewer: View {
    var url: URL
    @Environment(\.dismiss) private var dismiss
    @State private var scale: CGFloat = 1
    @State private var baseScale: CGFloat = 1

    var body: some View {
        ZStack(alignment: .topTrailing) {
            Color.black.ignoresSafeArea()
            AsyncImage(url: url) { phase in
                switch phase {
                case .success(let image):
                    image
                        .resizable()
                        .scaledToFit()
                        .scaleEffect(scale)
                        .gesture(magnify)
                        .simultaneousGesture(
                            TapGesture(count: 2).onEnded {
                                scale = 1
                                baseScale = 1
                            }
                        )
                case .failure:
                    Text("Could not load this photo.")
                        .foregroundStyle(.white)
                default:
                    ProgressView()
                        .tint(.white)
                }
            }
            .padding(16)
            .frame(maxWidth: .infinity, maxHeight: .infinity)

            Button {
                dismiss()
            } label: {
                Image(systemName: "xmark.circle.fill")
                    .font(.system(size: 30))
                    .symbolRenderingMode(.palette)
                    .foregroundStyle(.white, Color.black.opacity(0.55))
                    .frame(width: 44, height: 44)
            }
            .padding(.top, 8)
            .padding(.trailing, 12)
            .accessibilityLabel("Close")
        }
        .preferredColorScheme(.dark)
    }

    private var magnify: some Gesture {
        MagnifyGesture()
            .onChanged { value in
                scale = min(max(baseScale * value.magnification, 1), 5)
            }
            .onEnded { value in
                let next = min(max(baseScale * value.magnification, 1), 5)
                scale = next
                baseScale = next
            }
    }
}
