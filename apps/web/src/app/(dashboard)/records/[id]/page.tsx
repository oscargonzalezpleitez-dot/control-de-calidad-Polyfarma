import RecordDetailClient from './record-detail.client';

export function generateStaticParams() {
  return [{ id: '_' }];
}

export default function Page() {
  return <RecordDetailClient />;
}
