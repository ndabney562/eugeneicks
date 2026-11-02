import XCTest
@testable import EugeneicksKit

final class CloudSaveBridgeTests: XCTestCase {
    func testDecodesTheGamesCopyWithSortedKeys() throws {
        let json = #"{"type":"cloudSave","gen":3,"save":{"v":1,"at":5,"achievements":["a"],"progress":null,"save":null}}"#
        let message = try BridgeMessage.decode(Data(json.utf8))
        guard case .cloudSave(let save, let gen) = message else { return XCTFail("expected a cloud save") }
        XCTAssertEqual(gen, 3)
        XCTAssertEqual(String(decoding: save, as: UTF8.self), #"{"achievements":["a"],"at":5,"progress":null,"save":null,"v":1}"#)
    }

    func testACopyWithoutItsSaveOrNumberIsIgnored() throws {
        XCTAssertEqual(try BridgeMessage.decode(Data(#"{"type":"cloudSave","gen":1}"#.utf8)), .unknown("cloudSave"))
        XCTAssertEqual(try BridgeMessage.decode(Data(#"{"type":"cloudSave","save":{}}"#.utf8)), .unknown("cloudSave"))
    }

    func testApplyCloudPassesTheCopyAsJSON() {
        let command = BridgeCommand.applyCloud(json: Data(#"{"v":1,"note":"\");alert(1);(\""}"#.utf8), gen: 2)
        XCTAssertEqual(command.javaScript, #"window.eugeneicksNative && window.eugeneicksNative.applyCloud({"note":"\");alert(1);(\"","v":1}, 2);"#)
    }

    func testApplyCloudWithDamagedDataOnlyRefreshes() {
        XCTAssertEqual(BridgeCommand.applyCloud(json: Data("nope".utf8), gen: 1).javaScript, BridgeCommand.refresh.javaScript)
    }
}

@MainActor
final class CloudSaveSyncTests: XCTestCase {
    private let mine = Data(#"{"v":1,"at":1}"#.utf8)
    private let theirs = Data(#"{"v":1,"at":2}"#.utf8)

    func testUploadsWhenCloudIsEmpty() {
        let kv = MemoryKeyValueStore()
        let sync = CloudSaveSync(store: kv)
        XCTAssertNil(sync.commandForGame())
        sync.received(json: mine, gen: 0)
        XCTAssertEqual(kv.data(forKey: CloudSaveSync.defaultKey), mine)
    }

    func testIgnoresPostsWhileACopyIsPending() {
        let kv = MemoryKeyValueStore([CloudSaveSync.defaultKey: theirs])
        let sync = CloudSaveSync(store: kv)
        // The game reports its own saves before it's ready: they haven't taken in iCloud's yet
        sync.received(json: mine, gen: 0)
        XCTAssertEqual(kv.data(forKey: CloudSaveSync.defaultKey), theirs)
        XCTAssertEqual(sync.commandForGame(), .applyCloud(json: theirs, gen: 1))
        XCTAssertNil(sync.commandForGame(), "sent once")
        sync.received(json: mine, gen: 0)
        XCTAssertEqual(kv.data(forKey: CloudSaveSync.defaultKey), theirs, "still from before the merge")
        sync.received(json: mine, gen: 1)
        XCTAssertEqual(kv.data(forKey: CloudSaveSync.defaultKey), mine)
    }

    func testSendsAgainWhenAnotherDeviceChangesIt() {
        let kv = MemoryKeyValueStore([CloudSaveSync.defaultKey: theirs])
        let sync = CloudSaveSync(store: kv)
        _ = sync.commandForGame()
        kv.set(mine, forKey: CloudSaveSync.defaultKey)
        sync.cloudChanged()
        XCTAssertEqual(sync.commandForGame(), .applyCloud(json: mine, gen: 2))
    }

    func testResendsAfterGameReset() {
        let kv = MemoryKeyValueStore([CloudSaveSync.defaultKey: theirs])
        let sync = CloudSaveSync(store: kv)
        _ = sync.commandForGame()
        sync.gameReset()
        // The reloaded page numbers its copies from 0 again: nothing is uploaded until it has the cloud copy
        sync.received(json: mine, gen: 0)
        XCTAssertEqual(kv.data(forKey: CloudSaveSync.defaultKey), theirs)
        XCTAssertEqual(sync.commandForGame(), .applyCloud(json: theirs, gen: 2))
    }

    func testStoreSendsTheCloudCopyWhenTheGameIsReady() {
        let kv = MemoryKeyValueStore([CloudSaveSync.defaultKey: theirs])
        let (store, sink, _) = makeStore(cloud: CloudSaveSync(store: kv))
        store.cloudChanged()
        XCTAssertTrue(sink.sent.isEmpty, "waits for the title screen")
        store.receive(.ready)
        XCTAssertEqual(sink.sent, [.applyCloud(json: theirs, gen: 1)])
        store.receive(.cloudSave(json: mine, gen: 1))
        XCTAssertEqual(kv.data(forKey: CloudSaveSync.defaultKey), mine)
        kv.set(theirs, forKey: CloudSaveSync.defaultKey)
        store.cloudChanged()
        XCTAssertEqual(sink.sent.last, .applyCloud(json: theirs, gen: 2), "sent at once while the game is ready")
    }
}
