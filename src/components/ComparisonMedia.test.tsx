import { render, screen, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { ComparisonMedia } from './ComparisonMedia';
import { studyManifest } from '../study/manifest';

describe('candidate references', () => {
  it('keeps the shared reference for matching requests', () => {
    render(<ComparisonMedia trial={studyManifest.trials[0]} labels={['Left','Right']} time={1} playing={false} />);
    expect(screen.getAllByLabelText('Ground Truth reference')).toHaveLength(1);
  });
  it('places each distinct reference under the video it describes', () => {
    const trial = studyManifest.trials.find((item) => item.first.groundTruth)!;
    const { container } = render(<ComparisonMedia trial={trial} labels={['Left','Right']} time={1} playing={false} />);
    const columns = container.querySelectorAll('.candidate-with-reference');
    expect(columns).toHaveLength(2);
    [trial.first,trial.second].forEach((candidate,index) => {
      expect(columns[index].querySelector('video')).toHaveAttribute('src',candidate.src);
      expect(within(columns[index] as HTMLElement).getByText(candidate.groundTruth!.events[0].text)).toBeInTheDocument();
    });
  });
});
