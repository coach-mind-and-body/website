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

    static func watchURL(_ id: String) -> URL {
        URL(string: "https://www.youtube.com/watch?v=\(id)")!
    }
}

/// Plays in-app. YouTube error 152-4 is a missing Referer in WKWebView iframes —
/// we load the embed URL directly with a Safari user agent and our site as Referer.
struct YouTubeEmbed: UIViewRepresentable {
    let videoId: String

    func makeCoordinator() -> Coordinator { Coordinator() }

    func makeUIView(context: Context) -> WKWebView {
        let config = WKWebViewConfiguration()
        config.allowsInlineMediaPlayback = true
        config.mediaTypesRequiringUserActionForPlayback = []
        let web = WKWebView(frame: .zero, configuration: config)
        web.customUserAgent = "Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1"
        web.scrollView.isScrollEnabled = false
        web.backgroundColor = .black
        web.isOpaque = false
        web.navigationDelegate = context.coordinator
        return web
    }

    func updateUIView(_ webView: WKWebView, context: Context) {
        guard context.coordinator.loadedId != videoId else { return }
        context.coordinator.loadedId = videoId
        let url = URL(string: "https://www.youtube.com/embed/\(videoId)?playsinline=1&rel=0&modestbranding=1&fs=1")!
        var request = URLRequest(url: url)
        request.setValue("https://mindandbodyresetcoach.com/", forHTTPHeaderField: "Referer")
        request.setValue("https://mindandbodyresetcoach.com", forHTTPHeaderField: "Origin")
        webView.load(request)
    }

    final class Coordinator: NSObject, WKNavigationDelegate {
        var loadedId: String?
    }
}

struct YouTubePlayer: View {
    let videoId: String

    var body: some View {
        VStack(alignment: .leading, spacing: 8) {
            YouTubeEmbed(videoId: videoId)
                .frame(height: 210)
                .clipShape(RoundedRectangle(cornerRadius: 16, style: .continuous))
            Link("Open in YouTube", destination: YouTubeID.watchURL(videoId))
                .font(.caption.weight(.bold))
                .foregroundStyle(HTTheme.gold)
        }
    }
}
