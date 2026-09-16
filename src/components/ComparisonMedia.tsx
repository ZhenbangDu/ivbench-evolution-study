import { GroundTruth } from './GroundTruth';
import { MediaPanel } from './MediaPanel';
import type { Trial } from '../study/types';

export function ComparisonMedia({ trial, labels, playing, time }: {
  trial: Trial;
  labels: [string, string];
  playing: boolean;
  time: number;
}) {
  if (trial.first.groundTruth || trial.second.groundTruth) {
    return <section className="media-grid individual-references">
      {[trial.first, trial.second].map((candidate, index) => (
        <div className="candidate-with-reference" key={candidate.code}>
          <MediaPanel candidate={candidate} label={labels[index]} playing={playing} time={time} />
          <GroundTruth config={candidate.groundTruth ?? trial.groundTruth} time={time} />
        </div>
      ))}
    </section>;
  }
  return <section className="media-grid">
    <MediaPanel candidate={trial.first} label={labels[0]} playing={playing} time={time} />
    <GroundTruth config={trial.groundTruth} time={time} />
    <MediaPanel candidate={trial.second} label={labels[1]} playing={playing} time={time} />
  </section>;
}
