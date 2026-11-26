import UIKit

/// Long-edge downscale shared by meal-log scans and coach photo upload.
enum ImageJPEG {
    static let maxLongEdge: CGFloat = 1600

    /// Draws `image` so its longer side is at most `maxLongEdge` pixels.
    /// Smaller images are redrawn at their own size so orientation is baked in.
    static func downscaled(_ image: UIImage, maxLongEdge: CGFloat = ImageJPEG.maxLongEdge) -> UIImage? {
        let size = image.size
        guard size.width > 0, size.height > 0 else { return nil }
        let scale = min(1, maxLongEdge / max(size.width, size.height))
        let target = CGSize(width: max(1, size.width * scale), height: max(1, size.height * scale))
        let format = UIGraphicsImageRendererFormat.default()
        format.scale = 1
        let renderer = UIGraphicsImageRenderer(size: target, format: format)
        return renderer.image { _ in
            image.draw(in: CGRect(origin: .zero, size: target))
        }
    }

    static func jpegData(_ image: UIImage, compressionQuality: CGFloat) -> Data? {
        downscaled(image)?.jpegData(compressionQuality: compressionQuality)
    }
}
