'use client'

import {
  CalendarClock,
  Copy,
  Download,
  Lock,
  MoreHorizontal,
  Palette,
  Pencil,
  Trash2,
} from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  IconButton,
} from '@/components/ui'

interface BoardMenuProps {
  onAppearance: () => void
  onRename: () => void
  onDuplicate: () => void
  onSetPassword: () => void
  onLock: () => void
  canLock: boolean
  onLifespan: () => void
  onExportJson: () => void
  onExportCsv: () => void
  onDelete: () => void
}

export function BoardMenu({
  onAppearance,
  onRename,
  onDuplicate,
  onSetPassword,
  onLock,
  canLock,
  onLifespan,
  onExportJson,
  onExportCsv,
  onDelete,
}: BoardMenuProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <IconButton label="Board options" size="sm" icon={<MoreHorizontal />} />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onSelect={onAppearance}>
          <Palette />
          Appearance
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onSelect={onRename}>
          <Pencil />
          Rename board
        </DropdownMenuItem>
        <DropdownMenuItem onSelect={onDuplicate}>
          <Copy />
          Duplicate board…
        </DropdownMenuItem>
        <DropdownMenuItem onSelect={onSetPassword}>
          <Lock />
          Board password
        </DropdownMenuItem>
        {canLock && (
          <DropdownMenuItem onSelect={onLock}>
            <Lock />
            Lock board
          </DropdownMenuItem>
        )}
        <DropdownMenuItem onSelect={onLifespan}>
          <CalendarClock />
          Board lifespan…
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onSelect={onExportJson}>
          <Download />
          Export as JSON
        </DropdownMenuItem>
        <DropdownMenuItem onSelect={onExportCsv}>
          <Download />
          Export as CSV
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem destructive onSelect={onDelete}>
          <Trash2 />
          Delete board
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
