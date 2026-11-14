/**
 * Builds the enquiry slice into dist-slice/.
 *
 * The slice is the shipped site with one thing switched on: the enquiry form
 * really posts, to a TEST store. It exists to prove the whole path works. It
 * is never the published site: dist/ is not touched, and the slice says on
 * the form and on the receipt that the enquiry does not reach ACS.
 */
(globalThis as { __ACS_SLICE__?: string }).__ACS_SLICE__ = 'enquiry';
await import('./build');

export {};
