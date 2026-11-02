import Foundation

/// Where the saves are kept: `NSUbiquitousKeyValueStore` in the app (iCloud), a dictionary in tests.
public protocol KeyValueStoring: AnyObject {
    func data(forKey key: String) -> Data?
    func set(_ value: Any?, forKey key: String)
}

public final class MemoryKeyValueStore: KeyValueStoring {
    private var values: [String: Data]

    public init(_ values: [String: Data] = [:]) {
        self.values = values
    }

    public func data(forKey key: String) -> Data? { values[key] }
    public func set(_ value: Any?, forKey key: String) { values[key] = value as? Data }
}

/// Carries the game's saves to and from iCloud. The game does the merging (src/core/cloudSave.ts); this only decides
/// when to hand it iCloud's copy and which of its copies to upload. Each copy sent is numbered (`gen`) and the game
/// echoes the number of the last one it merged, so a copy that hasn't taken in iCloud's never replaces it.
@MainActor
public final class CloudSaveSync {
    nonisolated public static let defaultKey = "saves.v1"

    private let store: KeyValueStoring
    private let key: String
    /// iCloud has a copy the game hasn't merged yet.
    public private(set) var pending: Bool
    private var sentGen = 0

    public init(store: KeyValueStoring, key: String = CloudSaveSync.defaultKey) {
        self.store = store
        self.key = key
        pending = store.data(forKey: key) != nil
    }

    /// The command that hands the game iCloud's copy, once per change (nil when it has it already).
    public func commandForGame() -> BridgeCommand? {
        guard pending else { return nil }
        pending = false
        guard let data = store.data(forKey: key) else { return nil }
        sentGen += 1
        return .applyCloud(json: data, gen: sentGen)
    }

    /// A copy from the game: uploaded if it has merged the last one sent (and differs from iCloud's).
    public func received(json: Data, gen: Int) {
        guard !pending, gen >= sentGen, store.data(forKey: key) != json else { return }
        store.set(json, forKey: key)
    }

    /// Another device changed iCloud's copy.
    public func cloudChanged() {
        expectGameToCatchUp()
    }

    /// The game's page reloaded: it numbers its copies from 0 again and hasn't merged anything.
    public func gameReset() {
        expectGameToCatchUp()
    }

    private func expectGameToCatchUp() {
        pending = store.data(forKey: key) != nil
        // Nothing in iCloud (signed out, or wiped): whatever the game has is the copy to keep
        if !pending { sentGen = 0 }
    }
}
