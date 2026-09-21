import EmojiPicker, { EmojiStyle, Theme } from 'emoji-picker-react';
import { useState } from 'react';
import { HexColorInput, HexColorPicker } from 'react-colorful';

import { Button } from '@common/components/Button';
import { useTheme } from '@common/styles/ThemeProvider';
import { TypographySmall } from '@common/styles/Typography';

import { type AvatarDraft } from './avatar';
import styles from './AvatarEditor.module.scss';
import { SectionCard } from './SectionCard';
import { useSession } from '../auth/session';

// A picked color can be a 3-digit hex, which the server doesn't accept.
function toSixDigitHex(color: string): string {
  const short = /^#([0-9a-f])([0-9a-f])([0-9a-f])$/i.exec(color);
  return short ? `#${short[1]}${short[1]}${short[2]}${short[2]}${short[3]}${short[3]}` : color;
}

export type AvatarEditorProps = {
  saved: AvatarDraft;
  draft: AvatarDraft;
  onDraftChange: (draft: AvatarDraft) => void;
  onClose: () => void;
};

export function AvatarEditor({ saved, draft, onDraftChange, onClose }: AvatarEditorProps) {
  const { resolved } = useTheme();
  const { updateAvatar } = useSession();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const dirty =
    draft.icon !== saved.icon || draft.color.toLowerCase() !== saved.color.toLowerCase();

  async function save() {
    if (!draft.icon) {
      return;
    }
    setSaving(true);
    setError(null);
    try {
      await updateAvatar({ avatarIcon: draft.icon, avatarColor: toSixDigitHex(draft.color) });
      onClose();
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : 'Failed to save your avatar');
    } finally {
      setSaving(false);
    }
  }

  return (
    <SectionCard
      title="Edit avatar"
      description="Pick an emoji and a color. Your avatar above updates as you go."
    >
      <div className={styles.body}>
        <div className={styles.pane}>
          <TypographySmall as="span" className={styles.paneLabel}>
            Emoji
          </TypographySmall>
          <EmojiPicker
            className={styles.emojiPicker}
            width="100%"
            height={380}
            theme={resolved === 'dark' ? Theme.DARK : Theme.LIGHT}
            emojiStyle={EmojiStyle.NATIVE}
            previewConfig={{ showPreview: false }}
            lazyLoadEmojis
            onEmojiClick={(emoji) => onDraftChange({ ...draft, icon: emoji.emoji })}
          />
        </div>
        <div className={styles.pane}>
          <TypographySmall as="span" className={styles.paneLabel}>
            Color
          </TypographySmall>
          <HexColorPicker
            className={styles.colorPicker}
            color={draft.color}
            onChange={(color) => onDraftChange({ ...draft, color })}
          />
          <HexColorInput
            className={styles.hexInput}
            aria-label="Hex color"
            prefixed
            color={draft.color}
            onChange={(color) => onDraftChange({ ...draft, color })}
          />
        </div>
      </div>
      {error ? (
        <TypographySmall as="p" className={styles.error}>
          {error}
        </TypographySmall>
      ) : null}
      <div className={styles.footer}>
        {!draft.icon ? (
          <TypographySmall as="span" className={styles.hint}>
            Pick an emoji to save.
          </TypographySmall>
        ) : null}
        <Button type="button" style="small" outlined label="Cancel" onClick={onClose} />
        <Button
          type="button"
          style="small"
          label="Save changes"
          disabled={!dirty || !draft.icon}
          isLoading={saving}
          onClick={() => void save()}
        />
      </div>
    </SectionCard>
  );
}
