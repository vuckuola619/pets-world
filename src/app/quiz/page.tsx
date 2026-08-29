import type { Metadata } from 'next'
import QuizView from './QuizView'

export const metadata: Metadata = {
  title: 'Wildlife Quiz',
  description:
    'Test what you know about wildlife and dinosaurs — guess species from blurred photos, true-or-false fun facts, conservation status, and habitats. Available in English and Indonesian.',
  alternates: { canonical: '/quiz' },
}

export default function QuizPage() {
  return <QuizView />
}
