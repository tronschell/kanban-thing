'use client'

import { useEffect, useMemo, useState } from 'react'
import { Check, Eye, EyeOff, Link as LinkIcon } from 'lucide-react'
import {
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  Modal,
  ModalFooter,
} from '@/components/ui'
import { createClient } from '@/lib/supabase/client'

type Status = 'idle' | 'copied' | 'revoked' | 'failed'

const labels: Record<Status, string> = {
  idle: 'Share',
  copied: 'Copied',
  revoked: 'Link revoked',
  failed: 'Share failed',
}

export default function ShareLink({ boardId }: { boardId: string }) {
  const [status, setStatus] = useState<Status>('idle')
  const [isRevoking, setIsRevoking] = useState(false)
  const [viewUrl, setViewUrl] = useState<string | null>(null)
  const supabase = useMemo(createClient, [])

  useEffect(() => {
    if (status === 'idle') return
    const timer = setTimeout(() => setStatus('idle'), 2500)
    return () => clearTimeout(timer)
  }, [status])

  const boardPassword = () => localStorage.getItem(`board_password_${boardId}`) ?? ''

  const copy = async (url: string) => {
    try {
      await navigator.clipboard.writeText(url)
      setStatus('copied')
    } catch (error) {
      console.error('Failed to copy board link:', error)
      setStatus('failed')
    }
  }

  const copyEditLink = () => copy(`${window.location.origin}/board?id=${boardId}`)

  // WebKit drops transient user activation across an awaited non-clipboard promise,
  // so the token is minted when the menu opens and copied synchronously on select.
  const mintViewLink = async (open: boolean) => {
    if (!open) return
    setViewUrl(null)

    const { data, error } = await supabase.rpc('board_view_token', {
      board_id_param: boardId,
      password_attempt: boardPassword(),
    })

    if (error || data?.status !== 'ok') {
      console.error('Failed to mint view-only token:', error ?? data?.status)
      return
    }

    setViewUrl(`${window.location.origin}/board?id=${boardId}&view=${data.view_token}`)
  }

  const revokeViewLink = async () => {
    setIsRevoking(false)

    const { data, error } = await supabase.rpc('board_revoke_view_token', {
      board_id_param: boardId,
      password_attempt: boardPassword(),
    })

    if (error || data !== 'ok') {
      console.error('Failed to revoke view-only token:', error ?? data)
      setStatus('failed')
      return
    }

    setViewUrl(null)
    setStatus('revoked')
  }

  return (
    <>
      <DropdownMenu onOpenChange={(open) => void mintViewLink(open)}>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="sm" aria-live="polite">
            {status === 'idle' || status === 'failed' ? <LinkIcon /> : <Check />}
            {labels[status]}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onSelect={copyEditLink}>
            <LinkIcon />
            Copy edit link
          </DropdownMenuItem>
          <DropdownMenuItem onSelect={() => (viewUrl ? copy(viewUrl) : setStatus('failed'))}>
            <Eye />
            Copy view-only link
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem destructive onSelect={() => setIsRevoking(true)}>
            <EyeOff />
            Revoke view-only link
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <Modal
        open={isRevoking}
        onClose={() => setIsRevoking(false)}
        title="Revoke view-only link"
        size="sm"
      >
        <p className="text-sm text-muted">
          Every view-only link you have already shared stops working immediately, and the next one
          you copy will use a new address.
        </p>
        <ModalFooter>
          <Button variant="ghost" onClick={() => setIsRevoking(false)}>
            Cancel
          </Button>
          <Button variant="danger" onClick={revokeViewLink}>
            Revoke link
          </Button>
        </ModalFooter>
      </Modal>
    </>
  )
}
