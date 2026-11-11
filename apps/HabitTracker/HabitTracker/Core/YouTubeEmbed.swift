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

    static func thumbURL(_ id: String) -> URL {
        URL(string: "https://img.youtube.com/vi/\(id)/hqdefault.jpg")!
    }
}

/// Keeps one web view alive when a fold only changes the layout around the player.
final class YouTubeHold {
    var webView: WKWebView?
    fileprivate var loadedKey: String?
    /// True when the embedded video is playing. Fitness uses this to run the workout timer.
    var onPlayState: ((Bool) -> Void)?
    let playBridge = YouTubePlayBridge()
    private var hooked = false

    func play() { run("var v=document.querySelector('video'); if(v){v.play();}") }
    func pause() { run("var v=document.querySelector('video'); if(v){v.pause();}") }
    func skip(_ seconds: Double) {
        run("var v=document.querySelector('video'); if(v){v.currentTime=Math.max(0,v.currentTime+(\(seconds)));}")
    }
    func rate(_ value: Double) { run("var v=document.querySelector('video'); if(v){v.playbackRate=\(value);}") }

    fileprivate func hook() {
        guard !hooked else { return }
        hooked = true
        playBridge.onMessage = { [weak self] body in
            if body == "play" { self?.onPlayState?(true) }
            if body == "pause" { self?.onPlayState?(false) }
        }
    }

    private func run(_ script: String) {
        webView?.evaluateJavaScript(script, completionHandler: nil)
    }
}

final class YouTubePlayBridge: NSObject, WKScriptMessageHandler {
    var onMessage: ((String) -> Void)?

    func userContentController(_ userContentController: WKUserContentController, didReceive message: WKScriptMessage) {
        if let body = message.body as? String { onMessage?(body) }
    }

    static let hookScript = """
    (function() {
      function hook() {
        var nodes = document.querySelectorAll('video');
        for (var i = 0; i < nodes.length; i++) {
          var v = nodes[i];
          if (v.dataset.htHook) continue;
          v.dataset.htHook = '1';
          v.addEventListener('play', function() { window.webkit.messageHandlers.yt.postMessage('play'); });
          v.addEventListener('pause', function() { window.webkit.messageHandlers.yt.postMessage('pause'); });
        }
        if (!nodes.length) setTimeout(hook, 400);
      }
      hook();
      new MutationObserver(hook).observe(document.documentElement, { childList: true, subtree: true });
    })();
    """
}

/// Plays in-app. YouTube error 152-4 is a missing Referer in WKWebView iframes —
/// we load the embed URL directly with a Safari user agent and our site as Referer.
struct YouTubeEmbed: UIViewRepresentable {
    let videoId: String
    var startSeconds: Int = 0
    var hold: YouTubeHold? = nil

    func makeCoordinator() -> Coordinator { Coordinator() }

    func makeUIView(context: Context) -> WKWebView {
        if let existing = hold?.webView { return existing }
        let config = WKWebViewConfiguration()
        config.allowsInlineMediaPlayback = true
        config.mediaTypesRequiringUserActionForPlayback = []
        if let hold {
            hold.hook()
            let scripts = WKUserContentController()
            scripts.add(hold.playBridge, name: "yt")
            scripts.addUserScript(WKUserScript(source: YouTubePlayBridge.hookScript, injectionTime: .atDocumentEnd, forMainFrameOnly: true))
            config.userContentController = scripts
        }
        let web = WKWebView(frame: .zero, configuration: config)
        web.customUserAgent = "Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1"
        web.scrollView.isScrollEnabled = false
        web.backgroundColor = .black
        web.isOpaque = false
        web.navigationDelegate = context.coordinator
        hold?.webView = web
        return web
    }

    func updateUIView(_ webView: WKWebView, context: Context) {
        let key = "\(videoId)-\(startSeconds)"
        if hold?.loadedKey == key || context.coordinator.loadedId == key { return }
        hold?.loadedKey = key
        context.coordinator.loadedId = key
        var urlStr = "https://www.youtube.com/embed/\(videoId)?playsinline=1&enablejsapi=1&rel=0&modestbranding=1&fs=1"
        if startSeconds > 0 { urlStr += "&start=\(startSeconds)" }
        let url = URL(string: urlStr)!
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
    var hold: YouTubeHold? = nil

    var body: some View {
        VStack(alignment: .leading, spacing: 8) {
            YouTubeEmbed(videoId: videoId, hold: hold)
                .duoStage()
                .clipShape(RoundedRectangle(cornerRadius: 16, style: .continuous))
            Link("Open in YouTube", destination: YouTubeID.watchURL(videoId))
                .font(.caption.weight(.bold))
                .foregroundStyle(HTTheme.gold)
        }
    }
}

/// Drive (Meet recording) preview. File must be shared "Anyone with the link".
struct ReplayWebView: UIViewRepresentable {
    let url: URL

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
        guard context.coordinator.loaded != url.absoluteString else { return }
        context.coordinator.loaded = url.absoluteString
        var request = URLRequest(url: url)
        request.setValue("https://mindandbodyresetcoach.com/", forHTTPHeaderField: "Referer")
        webView.load(request)
    }

    final class Coordinator: NSObject, WKNavigationDelegate {
        var loaded: String?
    }
}
