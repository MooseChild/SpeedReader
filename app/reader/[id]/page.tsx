import { ReaderView } from '@/components/reader-view'

export default function ReaderPage({ params }: { params: { id: string } }) {
  return <ReaderView documentId={params?.id ?? ''} />
}
