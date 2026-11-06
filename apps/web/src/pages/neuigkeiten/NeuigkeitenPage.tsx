import { releasedNews } from '@dos/shared/news'
import { currentVersion } from '../../data/news'
import { NewsList } from '../../shell/NewsList'
import { LegalPage } from '../rechtliches/LegalPage'

/** All updates up to the running version, newest first; reachable without login */
export function NeuigkeitenPage() {
  return (
    <LegalPage title="Neuigkeiten" stand={null}>
      <p>Was die einzelnen Versionen von Dominion of Steam Neues gebracht haben.</p>
      <NewsList releases={releasedNews(currentVersion())} />
    </LegalPage>
  )
}
