import { releasedNews } from '@dos/shared/news'
import { currentVersion } from '../../data/news'
import { NewsList } from '../../shell/NewsList'
import { LegalPage } from '../rechtliches/LegalPage'
import { useT } from '../../i18n'

/** All updates up to the running version, newest first; reachable without login */
export function NeuigkeitenPage() {
  const t = useT()
  return (
    <LegalPage title={t('legal.newsTitle')} stand={null}>
      <p>{t('legal.newsIntro')}</p>
      <NewsList releases={releasedNews(currentVersion())} />
    </LegalPage>
  )
}
