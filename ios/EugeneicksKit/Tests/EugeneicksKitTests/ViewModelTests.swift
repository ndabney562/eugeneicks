import XCTest
@testable import EugeneicksKit

@MainActor
final class SettingsViewModelTests: XCTestCase {
    func testTogglesGoToTheGame() {
        let (store, sink, _) = makeStore()
        store.receive(.ready)
        let vm = SettingsViewModel(store: store)
        vm.sound = false
        vm.autoAim = false
        vm.twinStick = true
        vm.reducedMotion = true
        XCTAssertFalse(vm.sound)
        XCTAssertTrue(vm.twinStick)
        XCTAssertEqual(sink.sent, [
            .setSettings(SettingsPatch(sound: false)),
            .setSettings(SettingsPatch(autoAim: false)),
            .setSettings(SettingsPatch(twinStick: true)),
            .setSettings(SettingsPatch(reducedMotion: true)),
        ])
    }

    func testHapticsStayInTheApp() {
        let (store, sink, _) = makeStore()
        store.receive(.ready)
        let vm = SettingsViewModel(store: store)
        vm.haptics = false
        XCTAssertFalse(store.hapticsEnabled)
        XCTAssertTrue(sink.sent.isEmpty)
    }

    func testVersion() {
        let (store, _, _) = makeStore(snapshot: nil)
        XCTAssertEqual(SettingsViewModel(store: store).gameVersion, "Loading…")
        store.receive(.snapshot(.sample))
        XCTAssertEqual(SettingsViewModel(store: store).gameVersion, "v0.32.0 (sample)")
    }
}
