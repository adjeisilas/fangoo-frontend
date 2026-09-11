/**
 * Remote imagery, served from the Unsplash CDN.
 *
 * Every entry here has been opened and looked at, not just checked for HTTP 200.
 * That matters: the previous set passed a status check while actually showing a
 * competitor's forecourt sign, a car mechanic, and a container port — none of which
 * had anything to do with fuel distribution. If you swap one, look at it first.
 *
 * Images are supporting atmosphere, usually behind an overlay; they never carry
 * meaning. If one fails to load the panel still reads correctly.
 */
export interface SiteImage {
  src: string;
  alt: string;
  width: number;
  height: number;
}

const CDN = 'https://images.unsplash.com';

const remote = (id: string, width: number, height: number) =>
  `${CDN}/${id}?auto=format&fit=crop&w=${width}&h=${height}&q=70`;

export const imagery = {
  /** Verified: bulk fuel tanks silhouetted against a golden-hour sky. The warm tone
   *  is why this one carries the hero — it sits in the same amber family as `brand`. */
  sunset: {
    src: remote('photo-1783172582138-768832ca38a5', 1800, 900),
    alt: 'Bulk fuel storage tanks silhouetted against a sunset',
    width: 1800,
    height: 900,
  },
  /** Verified: aerial view over Accra — red earth roads and dense rooftops. The one
   *  image on the site that says where this marketplace actually operates. */
  accra: {
    src: remote('photo-1568025848823-86404cd04ad1', 1200, 900),
    alt: 'Aerial view across Accra, Ghana',
    width: 1200,
    height: 900,
  },
  /** Verified: two white bulk fuel storage tanks at a depot, behind a green field. */
  depot: {
    src: remote('photo-1772376920749-afdc99c517f7', 1200, 900),
    alt: 'Bulk fuel storage tanks at a distribution depot',
    width: 1200,
    height: 900,
  },
  /** Verified: polished steel fuel tank trailers with hazard placards, parked in a yard. */
  tanker: {
    src: remote('photo-1656988826404-bbb5ccb779bc', 1200, 800),
    alt: 'Steel fuel tank trailers parked in a haulage yard',
    width: 1200,
    height: 800,
  },
  /** Verified: articulated fuel tankers queuing under a depot loading gantry. */
  loadingBay: {
    src: remote('photo-1785620026441-3115e9ad2545', 1000, 1250),
    alt: 'Articulated fuel tankers loading at a depot gantry',
    width: 1000,
    height: 1250,
  },
} satisfies Record<string, SiteImage>;
