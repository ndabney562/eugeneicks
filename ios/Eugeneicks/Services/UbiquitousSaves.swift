import EugeneicksKit
import Foundation

/// iCloud key-value storage holds the saves (the game merges them: src/core/cloudSave.ts).
extension NSUbiquitousKeyValueStore: @retroactive KeyValueStoring {}

/// Connects the store to iCloud: pulls the latest copy at launch and tells the store when another device saves.
@MainActor
final class UbiquitousSaves {
    private let kv = NSUbiquitousKeyValueStore.default
    private var observer: NSObjectProtocol?

    /// The sync for the store to use; call `watch` once the store exists.
    func makeSync() -> CloudSaveSync {
        kv.synchronize()
        return CloudSaveSync(store: kv)
    }

    func watch(_ store: GameStore) {
        observer = NotificationCenter.default.addObserver(
            forName: NSUbiquitousKeyValueStore.didChangeExternallyNotification, object: kv, queue: .main
        ) { _ in
            MainActor.assumeIsolated { store.cloudChanged() }
        }
    }
}
