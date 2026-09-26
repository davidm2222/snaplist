import { describe, it, expect } from 'vitest';
import { extractGoogleMaps, extractAmazon, isGenericTitle } from './urlExtractors';

const u = (s: string) => new URL(s);

describe('extractGoogleMaps', () => {
  it('extracts name, address, and US town + state', () => {
    expect(
      extractGoogleMaps(u('https://www.google.com/maps/place/Coco+Ramen,+757+Beacon+St,+Newton+Centre,+MA+02459/data=!4m2'))
    ).toEqual({
      title: 'Coco Ramen',
      address: '757 Beacon St, Newton Centre, MA 02459',
      fields: { location: 'Newton Centre MA' },
    });
  });

  it('handles international addresses and URL encoding', () => {
    const r = extractGoogleMaps(u('https://www.google.com/maps/place/Caf%C3%A9+de+Flore,+172+Bd+Saint-Germain,+75006+Paris,+France/'));
    expect(r?.title).toBe('Café de Flore');
    expect(r?.fields.location).toBe('Paris France');
  });

  it('returns a name without location for landmarks', () => {
    expect(extractGoogleMaps(u('https://www.google.com/maps/place/Fenway+Park/@42.34,-71.09,17z')))
      .toEqual({ title: 'Fenway Park', address: undefined, fields: {} });
  });

  it('returns null for dropped pins and non-Maps URLs', () => {
    expect(extractGoogleMaps(u('https://www.google.com/maps/place/42.3601,-71.0589'))).toBeNull();
    expect(extractGoogleMaps(u('https://www.google.com/search?q=ramen'))).toBeNull();
    expect(extractGoogleMaps(u('https://example.com/maps/place/Foo'))).toBeNull();
  });
});

describe('extractAmazon', () => {
  it('reads the product name from the URL slug', () => {
    expect(extractAmazon(u('https://www.amazon.com/Apple-AirPods-Pro-2nd-Generation/dp/B0D1XD1ZV3'))?.title)
      .toBe('Apple AirPods Pro 2nd Generation');
  });

  it('returns null without a slug', () => {
    expect(extractAmazon(u('https://www.amazon.com/dp/B0D1XD1ZV3'))).toBeNull();
  });
});

describe('isGenericTitle', () => {
  it.each(['', 'Google Maps', 'YouTube', 'Amazon.com', 'Just a moment...'])('generic: %j', (t) =>
    expect(isGenericTitle(t)).toBe(true)
  );

  it('treats the site name as generic', () => {
    expect(isGenericTitle('The Atlantic', 'The Atlantic')).toBe(true);
  });

  it('keeps real titles', () => {
    expect(isGenericTitle('Coco Ramen')).toBe(false);
  });
});
