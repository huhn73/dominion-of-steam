import { Fragment, type ReactNode } from 'react'

/**
 * A translated text with markup in its placeholders:
 * `<Rich text={t('…')} email={<strong>{email}</strong>} />` puts the element at `{email}`.
 */
export function Rich({ text, ...parts }: { text: string } & Record<string, ReactNode>) {
  return (
    <>
      {text.split(/(\{\w+\})/).map((piece, i) => {
        const name = /^\{(\w+)\}$/.exec(piece)?.[1]
        return <Fragment key={i}>{name && name in parts ? parts[name] : piece}</Fragment>
      })}
    </>
  )
}
