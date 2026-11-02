import Foundation

/// A message from the bundled game (`post()` in src/core/native.ts).
public enum BridgeMessage: Equatable, Sendable {
    /// The title screen is up (after booting, and after every shift or menu) and the game takes commands.
    case ready
    /// A shift started.
    case playing
    /// Saved progress changed.
    case snapshot(GameSnapshot)
    /// The player left a shift, the board or the locker for the title screen.
    case exit
    /// The title's gear: show the Settings sheet.
    case openSettings
    /// The LEADERBOARD tab or button: show Game Center.
    case openGameCenter
    case haptic(HapticKind)
    /// A copy of the game's saves for iCloud (JSON, keys sorted), numbered with the last iCloud copy it merged in.
    case cloudSave(json: Data, gen: Int)
    /// Something this app version doesn't know (a newer game build): ignored.
    case unknown(String)

    private struct Envelope: Decodable {
        let type: String
        let kind: String?
    }

    public enum DecodeError: Error, Equatable {
        case notAnObject
    }

    /// Decodes a message's JSON.
    public static func decode(_ data: Data) throws -> BridgeMessage {
        let envelope = try JSONDecoder().decode(Envelope.self, from: data)
        switch envelope.type {
        case "ready":
            return .ready
        case "playing":
            return .playing
        case "exit":
            return .exit
        case "openSettings":
            return .openSettings
        case "openGameCenter":
            return .openGameCenter
        case "snapshot":
            return .snapshot(try JSONDecoder().decode(GameSnapshot.self, from: data))
        case "cloudSave":
            guard let object = try JSONSerialization.jsonObject(with: data) as? [String: Any],
                  let gen = object["gen"] as? Int, let save = object["save"] as? [String: Any] else { return .unknown("cloudSave") }
            return .cloudSave(json: try JSONSerialization.data(withJSONObject: save, options: [.sortedKeys, .withoutEscapingSlashes]), gen: gen)
        case "haptic":
            guard let kind = envelope.kind.flatMap(HapticKind.init(rawValue:)) else { return .unknown("haptic") }
            return .haptic(kind)
        default:
            return .unknown(envelope.type)
        }
    }

    /// Decodes what WebKit hands a script message handler (a dictionary built from the JS object).
    public static func decode(body: Any) throws -> BridgeMessage {
        guard JSONSerialization.isValidJSONObject(body), body is [String: Any] else { throw DecodeError.notAnObject }
        return try decode(JSONSerialization.data(withJSONObject: body))
    }
}
