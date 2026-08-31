import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { KanjiDataProvider } from './context/KanjiDataContext'
import { Layout } from './components/Layout'
import { MapPage } from './pages/MapPage'
import { WorldPage } from './pages/WorldPage'
import { StagePage } from './pages/StagePage'
import { KanjiListPage } from './pages/KanjiListPage'
import { KanjiDetailPage } from './pages/KanjiDetailPage'
import { ReviewPage } from './pages/ReviewPage'
import { StoriesPage } from './pages/StoriesPage'
import { StoryReaderPage } from './pages/StoryReaderPage'
import { StreetPage } from './pages/StreetPage'
import { ProfilePage } from './pages/ProfilePage'
import { AboutPage } from './pages/AboutPage'

export default function App() {
  return (
    <KanjiDataProvider>
      <BrowserRouter>
        <Routes>
          <Route element={<Layout />}>
            <Route path="/" element={<MapPage />} />
            <Route path="/mundo/:worldId" element={<WorldPage />} />
            <Route path="/etapa/:stageId" element={<StagePage />} />
            <Route path="/kanjis" element={<KanjiListPage />} />
            <Route path="/kanji/:id" element={<KanjiDetailPage />} />
            <Route path="/repaso" element={<ReviewPage />} />
            <Route path="/cuentos" element={<StoriesPage />} />
            <Route path="/cuento/:storyId" element={<StoryReaderPage />} />
            <Route path="/calle" element={<StreetPage />} />
            <Route path="/perfil" element={<ProfilePage />} />
            <Route path="/creditos" element={<AboutPage />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </KanjiDataProvider>
  )
}
