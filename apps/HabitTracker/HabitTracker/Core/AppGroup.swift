import Foundation

enum AppGroup {
    static var defaults: UserDefaults {
        UserDefaults(suiteName: AppConfig.appGroupId) ?? .standard
    }

    static let snapshotKey = "widget.snapshot.v1"
}
