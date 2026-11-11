import QuickLook
import SafariServices
import SwiftUI
import UIKit

struct IdentifiedURL: Identifiable, Hashable {
    let url: URL
    var id: String { url.absoluteString }
}

struct ProgramFilePreview: Identifiable, Hashable {
    var id: String
    var url: URL
    var name: String
}

/// Downloads a signed file URL into a temp file and previews it with QuickLook.
/// Share and Done stay in the app. A failed download falls back to the in-app browser.
struct InAppFilePreview: View {
    let remote: URL
    let name: String
    @Environment(\.dismiss) private var dismiss
    @State private var localURL: URL?
    @State private var useSafari = false

    var body: some View {
        Group {
            if useSafari {
                InAppSafari(url: remote)
            } else {
                NavigationStack {
                    Group {
                        if let localURL {
                            QuickLookPreview(url: localURL)
                                .ignoresSafeArea(edges: .bottom)
                        } else {
                            ProgressView("Opening")
                                .tint(HTTheme.gold)
                                .frame(maxWidth: .infinity, maxHeight: .infinity)
                                .background(HTTheme.cream)
                        }
                    }
                    .navigationTitle(name)
                    .navigationBarTitleDisplayMode(.inline)
                    .toolbar {
                        ToolbarItem(placement: .cancellationAction) {
                            Button("Done") { dismiss() }
                        }
                        if let localURL {
                            ToolbarItem(placement: .primaryAction) {
                                ShareLink(item: localURL) {
                                    Image(systemName: "square.and.arrow.up")
                                }
                                .accessibilityLabel("Share")
                            }
                        }
                    }
                }
            }
        }
        .task { await download() }
    }

    private func download() async {
        do {
            let (temp, response) = try await URLSession.shared.download(from: remote)
            if let http = response as? HTTPURLResponse, !(200 ... 299).contains(http.statusCode) {
                useSafari = true
                return
            }
            let folder = FileManager.default.temporaryDirectory.appendingPathComponent("program-previews", isDirectory: true)
            try FileManager.default.createDirectory(at: folder, withIntermediateDirectories: true)
            var filename = name
                .replacingOccurrences(of: "/", with: "-")
                .replacingOccurrences(of: ":", with: "-")
            if filename.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty {
                filename = "file"
            }
            if (filename as NSString).pathExtension.isEmpty, !remote.pathExtension.isEmpty {
                filename += ".\(remote.pathExtension)"
            }
            let dest = folder.appendingPathComponent(filename)
            if FileManager.default.fileExists(atPath: dest.path) {
                try FileManager.default.removeItem(at: dest)
            }
            try FileManager.default.moveItem(at: temp, to: dest)
            localURL = dest
        } catch {
            useSafari = true
        }
    }
}

private struct QuickLookPreview: UIViewControllerRepresentable {
    let url: URL

    func makeCoordinator() -> Coordinator {
        Coordinator(url: url)
    }

    func makeUIViewController(context: Context) -> QLPreviewController {
        let controller = QLPreviewController()
        controller.dataSource = context.coordinator
        return controller
    }

    func updateUIViewController(_ controller: QLPreviewController, context: Context) {
        context.coordinator.url = url
        controller.reloadData()
    }

    final class Coordinator: NSObject, QLPreviewControllerDataSource {
        var url: URL
        init(url: URL) { self.url = url }

        func numberOfPreviewItems(in controller: QLPreviewController) -> Int { 1 }

        func previewController(_ controller: QLPreviewController, previewItemAt index: Int) -> QLPreviewItem {
            url as NSURL
        }
    }
}

/// Stays inside the app (not the Safari app). Used for PDFs.
struct InAppSafari: UIViewControllerRepresentable {
    let url: URL

    func makeUIViewController(context: Context) -> SFSafariViewController {
        let vc = SFSafariViewController(url: url)
        vc.preferredControlTintColor = UIColor(red: 45 / 255, green: 59 / 255, blue: 45 / 255, alpha: 1)
        vc.dismissButtonStyle = .done
        return vc
    }

    func updateUIViewController(_ uiViewController: SFSafariViewController, context: Context) {}
}
