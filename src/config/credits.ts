/**
 * Photos by other people that the site uses, with the credit each licence
 * asks for. Shown on /credits/.
 */
export interface PhotoCredit {
  /** Where the photo is used. */
  use: string;
  title: string;
  author: string;
  /** Page of the original photo. */
  source: string;
  licence: string;
  licenceUrl: string;
  /** What was changed, as CC BY asks to be noted. */
  changes: string;
}

export const photoCredits: PhotoCredit[] = [
  {
    use: 'Sign designer wall: Brick wall',
    title: 'Red brick wall',
    author: 'Picdrome Public Domain Pictures',
    source: 'https://www.flickr.com/photos/65798313@N06/6186285060',
    licence: 'CC0 1.0',
    licenceUrl: 'https://creativecommons.org/publicdomain/zero/1.0/',
    changes: 'Cropped, resized and softened.',
  },
  {
    use: 'Sign designer wall: Old brick',
    title: 'Brick Wall Texture',
    author: 'wwarby',
    source: 'https://www.flickr.com/photos/26782864@N00/15052672122',
    licence: 'CC BY 2.0',
    licenceUrl: 'https://creativecommons.org/licenses/by/2.0/',
    changes: 'Cropped, resized, softened and darkened.',
  },
  {
    use: 'Sign designer wall: Plaster wall',
    title: 'concrete wall texture 3',
    author: 'coun2rparts',
    source: 'https://www.flickr.com/photos/37668587@N05/3508863709',
    licence: 'CC BY 2.0',
    licenceUrl: 'https://creativecommons.org/licenses/by/2.0/',
    changes: 'Cropped, resized and softened.',
  },
  {
    use: 'Sign designer wall: Concrete wall',
    title: '10 Grey Concrete Wall texture #4',
    author: 'texturepalace',
    source: 'https://www.flickr.com/photos/122127718@N08/14618584163',
    licence: 'CC BY 2.0',
    licenceUrl: 'https://creativecommons.org/licenses/by/2.0/',
    changes: 'Cropped, resized and softened.',
  },
  {
    use: 'Sign designer wall: Dark wall',
    title: '10 Grey Concrete Wall texture #3',
    author: 'texturepalace',
    source: 'https://www.flickr.com/photos/122127718@N08/14596575894',
    licence: 'CC BY 2.0',
    licenceUrl: 'https://creativecommons.org/licenses/by/2.0/',
    changes: 'Cropped, resized, softened and darkened.',
  },
  {
    use: 'Sign designer wall: Office wall',
    title: 'Concrete Wall Texture 1',
    author: 'James Snape',
    source: 'https://www.flickr.com/photos/51035814887@N01/3086990547',
    licence: 'CC BY 2.0',
    licenceUrl: 'https://creativecommons.org/licenses/by/2.0/',
    changes: 'Cropped, resized, softened and lightened.',
  },
];
