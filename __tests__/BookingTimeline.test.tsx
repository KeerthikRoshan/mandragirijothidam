import React from 'react';
import { Image, Text } from 'react-native';
import ReactTestRenderer from 'react-test-renderer';
import { BookingTimeline } from '../src/components/schedule/BookingTimeline';
import { ASSETS } from '../src/constants/assets';

const extractText = (node: any): string => {
  if (typeof node === 'string' || typeof node === 'number') return String(node);
  if (!node) return '';
  if (Array.isArray(node)) return node.map(extractText).join('');
  if (node.props && node.props.children) return extractText(node.props.children);
  return '';
};

describe('BookingTimeline Component', () => {
  it('renders empty state illustration and guidance message when bookings list is empty', () => {
    let renderer: ReactTestRenderer.ReactTestRenderer;
    ReactTestRenderer.act(() => {
      renderer = ReactTestRenderer.create(
        <BookingTimeline bookings={[]} viewMode="time" />
      );
    });

    const root = renderer!.root;
    const texts = root.findAllByType(Text).map(t => extractText(t.props.children));

    // Title and subtitle
    expect(texts).toContain('இந்த தேதியில் நிகழ்வுகள் இல்லை');
    expect(
      texts.some(t =>
        t.includes('புதிய நிகழ்வு அல்லது பூஜை முன்பதிவு செய்ய கீழே உள்ள பொத்தானை அழுத்தவும்.')
      )
    ).toBe(true);

    // Empty state calendar illustration image
    const images = root.findAllByType(Image);
    expect(images.length).toBeGreaterThan(0);
    expect(images[0].props.source).toEqual(ASSETS.images.schedule.emptyCalendar);
  });
});
