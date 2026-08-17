import SwiftUI
import WebKit

enum YouTubeID {
    static func parse(_ raw: String?) -> String? {
        guard let raw, !raw.isEmpty else { return nil }
        if raw.count == 11, raw.range(of: #"^[A-Za-z0-9_-]{11}$"#, options: .regularExpression) != nil {
            return raw
        }
        let pattern = #"(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?|shorts)\/|.*[?&]v=)|youtu\.be\/)([^\"&?\/\s]{11})"#
        guard let regex = try? NSRegularExpression(pattern: pattern, options: .caseInsensitive),
              let match = regex.firstMatch(in: raw, range: NSRange(raw.startIndex..., in: raw)),
              let range = Range(match.range(at: 1), in: raw)
        else { return nil }
        return String(raw[range])
    }
}

struct YouTubeEmbed: UIViewRepresentable {
    let videoId: String

    func makeCoordinator() -> Coordinator { Coordinator() }

    func makeUIView(context: Context) -> WKWebView {
        let config = WKWebViewConfiguration()
        config.allowsInlineMediaPlayback = true
        config.mediaTypesRequiringUserActionForPlayback = []
        let web = WKWebView(frame: .zero, configuration: config)
        web.scrollView.isScrollEnabled = false
        web.backgroundColor = .black
        web.isOpaque = false
        return web
    }

    func updateUIView(_ webView: WKWebView, context: Context) {
        guard context.coordinator.loadedId != videoId else { return }
        context.coordinator.loadedId = videoId
        let html = """
        <!DOCTYPE html>
        <html><head>
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1">
        <style>html,body{margin:0;background:#000;height:100%;}iframe{position:absolute;inset:0;width:100%;height:100%;border:0;}</style>
        </head><body>
        <iframe src="https://www.youtube.com/embed/\(videoId)?playsinline=1&rel=0&modestbranding=1" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen" allowfullscreen></iframe>
        </body></html>
        """
        webView.loadHTMLString(html, baseURL: URL(string: "https://www.youtube.com"))
    }

    final class Coordinator {
        var loadedId: String?
    }
}
