import { afterEach, expect, it } from 'vitest';
import { getLeaderboardApiUrl } from '../../src/core/leaderboard';

afterEach(() => {
  delete (window as any).__LEADERBOARD_API_URL__;
  localStorage.clear();
  window.history.replaceState(null, '', '/eugeneicks/');
});

it('uses the live scores server by default', () => {
  expect(getLeaderboardApiUrl()).toBe('https://eugeneicks-leaderboard.eugeneicks.workers.dev');
});
it('lets ?leaderboard= beat the page global, which beats a saved override', () => {
  localStorage.setItem('eugeneicks.leaderboard.url', 'https://saved.test');
  expect(getLeaderboardApiUrl()).toBe('https://saved.test');
  (window as any).__LEADERBOARD_API_URL__ = 'https://global.test';
  expect(getLeaderboardApiUrl()).toBe('https://global.test');
  window.history.replaceState(null, '', '/eugeneicks/?leaderboard=https://query.test');
  expect(getLeaderboardApiUrl()).toBe('https://query.test');
});
it("turns off with 'off', so tests never post to the live board", () => {
  (window as any).__LEADERBOARD_API_URL__ = 'off';
  expect(getLeaderboardApiUrl()).toBe('');
});
