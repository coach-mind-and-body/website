import SafariServices
import SwiftUI

struct IdentifiedURL: Identifiable, Hashable {
    let url: URL
    var id: String { url.absoluteString }
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
