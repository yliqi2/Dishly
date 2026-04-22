import { CommonModule } from '@angular/common';
import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { AuthServices } from '../../Core/Services/Auth/auth-services';
import { ForumService } from '../../Core/Services/Forum/forum.service';
import { ForumComment, ForumDetail, ForumOwner, ForumSummary } from '../../Core/Interfaces/Forum';

@Component({
  selector: 'app-forum',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './forum.html',
  styleUrl: './forum.css',
})
export class Forum implements OnInit {
  private readonly forumService = inject(ForumService);
  private readonly authService = inject(AuthServices);

  protected readonly user = toSignal<Record<string, unknown> | null>(this.authService.user$, { initialValue: null });
  protected readonly isAuthenticated = computed(() => !!this.user());
  protected readonly currentUserRole = computed(() => String(this.user()?.['rol'] ?? ''));
  protected readonly isAdmin = computed(() => this.currentUserRole() === 'admin');
  protected readonly currentUserName = computed(() => String(this.user()?.['nombre'] ?? this.user()?.['name'] ?? 'Dishly User'));
  protected readonly currentUserIconUrl = computed(() => {
    const iconPath = this.user()?.['icon_path'];
    const updatedAt = this.user()?.['updated_at'];

    if (typeof iconPath !== 'string' || !iconPath) {
      return null;
    }

    return this.authService.getAssetUrl(iconPath, typeof updatedAt === 'string' ? updatedAt : undefined);
  });

  protected forums: ForumSummary[] = [];
  protected selectedForum: ForumDetail | null = null;
  protected loadingForums = true;
  protected loadingForum = false;
  protected sidebarError: string | null = null;
  protected detailError: string | null = null;

  protected creatingForum = false;
  protected newForumTitle = '';
  protected newForumDescription = '';
  protected createForumError: string | null = null;

  protected postingComment = false;
  protected newComment = '';
  protected commentError: string | null = null;

  protected editingCommentId: number | null = null;
  protected editingCommentMessage = '';
  protected savingEditedComment = false;
  protected deletingCommentId: number | null = null;

  private temporaryForumId = -1;
  private temporaryCommentId = -1;

  ngOnInit(): void {
    this.loadForums();
  }

  protected loadForums(selectedForumId?: number): void {
    this.loadingForums = true;
    this.sidebarError = null;

    this.forumService.getForums().subscribe({
      next: (forums) => {
        this.forums = forums;
        this.loadingForums = false;

        const targetForumId = selectedForumId
          ?? this.selectedForum?.id_foro
          ?? this.forums[0]?.id_foro;

        if (targetForumId) {
          this.selectForum(targetForumId, false);
          return;
        }

        this.selectedForum = null;
      },
      error: (error) => {
        this.loadingForums = false;
        this.sidebarError = error?.error?.message ?? 'Could not load forums.';
        this.selectedForum = null;
      }
    });
  }

  protected selectForum(forumId: number, forceReload: boolean = true): void {
    if (!forceReload && this.selectedForum?.id_foro === forumId) {
      return;
    }

    this.loadingForum = true;
    this.detailError = null;
    this.editingCommentId = null;
    this.commentError = null;

    this.forumService.getForum(forumId).subscribe({
      next: (forum) => {
        this.selectedForum = forum;
        this.loadingForum = false;
        this.upsertForumSummary(forum);
      },
      error: (error) => {
        this.loadingForum = false;
        this.detailError = error?.error?.message ?? 'Could not load this discussion.';
      }
    });
  }

  protected createForum(): void {
    if (!this.isAuthenticated()) {
      this.createForumError = 'You must be logged in to create a new forum.';
      return;
    }

    const titulo = this.newForumTitle.trim();
    const descripcion = this.newForumDescription.trim();

    if (!titulo || !descripcion) {
      this.createForumError = 'Title and description are required.';
      return;
    }

    this.creatingForum = true;
    this.createForumError = null;

    const optimisticForum = this.buildOptimisticForum(titulo, descripcion);
    const previousSelectedForum = this.selectedForum;
    const previousForums = [...this.forums];

    this.selectedForum = optimisticForum;
    this.upsertForumSummary(optimisticForum, true);

    this.forumService.createForum({ titulo, descripcion }).subscribe({
      next: (forum) => {
        this.creatingForum = false;
        this.newForumTitle = '';
        this.newForumDescription = '';
        this.selectedForum = forum;
        this.upsertForumSummary(forum, true);
      },
      error: (error) => {
        this.creatingForum = false;
        this.selectedForum = previousSelectedForum;
        this.forums = previousForums;
        this.createForumError = this.extractErrorMessage(error, 'Could not create the forum.');
      }
    });
  }

  protected submitComment(): void {
    if (!this.selectedForum) {
      return;
    }

    if (!this.isAuthenticated()) {
      this.commentError = 'Log in to comment in this forum.';
      return;
    }

    const mensaje = this.newComment.trim();
    if (!mensaje) {
      this.commentError = 'Comment cannot be empty.';
      return;
    }

    this.postingComment = true;
    this.commentError = null;

    const optimisticComment = this.buildOptimisticComment(mensaje);
    this.selectedForum = {
      ...this.selectedForum,
      comments: [...this.selectedForum.comments, optimisticComment],
      comments_count: (this.selectedForum.comments_count ?? this.selectedForum.comments.length) + 1,
      last_activity_at: optimisticComment.created_at ?? optimisticComment.fecha,
    };
    this.bumpSummaryCommentCount(this.selectedForum.id_foro, 1, optimisticComment.created_at ?? optimisticComment.fecha);
    this.newComment = '';

    this.forumService.createComment(this.selectedForum.id_foro, mensaje).subscribe({
      next: ({ comment }) => {
        this.postingComment = false;
        this.selectedForum = {
          ...this.selectedForum!,
          comments: this.selectedForum!.comments.map((item) =>
            item.id_linea_foro === optimisticComment.id_linea_foro ? comment : item
          ),
          comments_count: this.selectedForum!.comments.length,
          last_activity_at: comment.created_at ?? comment.fecha,
        };
        this.syncForumSummary(this.selectedForum);
      },
      error: (error) => {
        this.postingComment = false;
        this.selectedForum = {
          ...this.selectedForum!,
          comments: this.selectedForum!.comments.filter((item) => item.id_linea_foro !== optimisticComment.id_linea_foro),
          comments_count: Math.max(0, (this.selectedForum!.comments_count ?? this.selectedForum!.comments.length) - 1),
        };
        this.bumpSummaryCommentCount(this.selectedForum.id_foro, -1, this.selectedForum.last_activity_at ?? null);
        this.newComment = mensaje;
        this.commentError = this.extractErrorMessage(error, 'Could not publish the comment.');
      }
    });
  }

  protected startEditing(comment: ForumComment): void {
    this.editingCommentId = comment.id_linea_foro;
    this.editingCommentMessage = comment.mensaje;
    this.commentError = null;
  }

  protected cancelEditing(): void {
    this.editingCommentId = null;
    this.editingCommentMessage = '';
    this.savingEditedComment = false;
  }

  protected saveEditedComment(comment: ForumComment): void {
    if (!this.selectedForum) {
      return;
    }

    const mensaje = this.editingCommentMessage.trim();
    if (!mensaje) {
      this.commentError = 'Comment cannot be empty.';
      return;
    }

    this.savingEditedComment = true;
    this.commentError = null;

    this.forumService.updateComment(this.selectedForum.id_foro, comment.id_linea_foro, mensaje).subscribe({
      next: ({ comment: updatedComment }) => {
        this.savingEditedComment = false;
        this.selectedForum = {
          ...this.selectedForum!,
          comments: this.selectedForum!.comments.map((item) =>
            item.id_linea_foro === updatedComment.id_linea_foro ? updatedComment : item
          ),
        };
        this.cancelEditing();
      },
      error: (error) => {
        this.savingEditedComment = false;
        this.commentError = this.extractErrorMessage(error, 'Could not update the comment.');
      }
    });
  }

  protected deleteComment(comment: ForumComment): void {
    if (!this.selectedForum) {
      return;
    }

    const confirmed = window.confirm('Delete this comment?');
    if (!confirmed) {
      return;
    }

    this.deletingCommentId = comment.id_linea_foro;
    this.commentError = null;

    this.forumService.deleteComment(this.selectedForum.id_foro, comment.id_linea_foro).subscribe({
      next: () => {
        this.selectedForum = {
          ...this.selectedForum!,
          comments: this.selectedForum!.comments.filter((item) => item.id_linea_foro !== comment.id_linea_foro),
        };
        this.bumpSummaryCommentCount(this.selectedForum.id_foro, -1, this.selectedForum.last_activity_at ?? null);
        this.deletingCommentId = null;
      },
      error: (error) => {
        this.deletingCommentId = null;
        this.commentError = this.extractErrorMessage(error, 'Could not delete the comment.');
      }
    });
  }

  protected isSelected(forumId: number): boolean {
    return this.selectedForum?.id_foro === forumId;
  }

  protected getOwnerAvatar(owner: ForumOwner): string | null {
    if (!owner.icon_path) {
      return null;
    }

    return this.authService.getAssetUrl(owner.icon_path, owner.updated_at ?? undefined);
  }

  protected getCommentAvatar(comment: ForumComment): string | null {
    if (!comment.autor_icon_path) {
      return null;
    }

    return this.authService.getAssetUrl(comment.autor_icon_path, comment.autor_updated_at ?? undefined);
  }

  protected formatDate(value?: string | null): string {
    if (!value) {
      return 'Unknown date';
    }

    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
      return value;
    }

    return new Intl.DateTimeFormat('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  }

  protected ownerInitial(name: string | undefined | null): string {
    return (name?.trim().charAt(0) || 'D').toUpperCase();
  }

  private syncForumSummary(forum: ForumDetail): void {
    this.upsertForumSummary(forum);
  }

  private bumpSummaryCommentCount(forumId: number, delta: number, lastActivityAt: string | null | undefined): void {
    const updatedForums = this.forums.map((item) => {
      if (item.id_foro !== forumId) {
        return item;
      }

      const nextCount = Math.max(0, Number(item.comments_count ?? 0) + delta);
      return {
        ...item,
        comments_count: nextCount,
        last_activity_at: lastActivityAt ?? item.last_activity_at,
      };
    });

    this.forums = this.sortForumsByActivity(updatedForums);
  }

  private upsertForumSummary(forum: ForumDetail, placeFirst: boolean = false): void {
    const summary: ForumSummary = {
      id_foro: forum.id_foro,
      titulo: forum.titulo,
      descripcion: forum.descripcion,
      fecha_creacion: forum.fecha_creacion,
      created_at: forum.created_at,
      updated_at: forum.updated_at,
      comments_count: forum.comments.length,
      last_activity_at: forum.comments.at(-1)?.created_at ?? forum.last_activity_at ?? forum.created_at,
      is_owner: forum.is_owner,
      owner: forum.owner,
    };

    const withoutCurrent = this.forums.filter((item) => item.id_foro !== forum.id_foro);
    const merged = placeFirst ? [summary, ...withoutCurrent] : [...withoutCurrent, summary];

    this.forums = placeFirst ? merged : this.sortForumsByActivity(merged);
  }

  private sortForumsByActivity(forums: ForumSummary[]): ForumSummary[] {
    return [...forums].sort((left, right) => {
      const leftTime = Date.parse(left.last_activity_at ?? left.created_at ?? left.fecha_creacion ?? '') || 0;
      const rightTime = Date.parse(right.last_activity_at ?? right.created_at ?? right.fecha_creacion ?? '') || 0;

      if (rightTime !== leftTime) {
        return rightTime - leftTime;
      }

      return right.id_foro - left.id_foro;
    });
  }

  private extractErrorMessage(error: any, fallback: string): string {
    const validationMessage = Object.values(error?.error?.errors ?? {})
      .flat()
      .find((value) => typeof value === 'string');

    return String(validationMessage ?? error?.error?.message ?? fallback);
  }

  private buildOptimisticForum(titulo: string, descripcion: string): ForumDetail {
    const now = new Date().toISOString();
    const currentUser = this.user();

    return {
      id_foro: this.temporaryForumId--,
      titulo,
      descripcion,
      fecha_creacion: now,
      created_at: now,
      updated_at: now,
      comments_count: 0,
      last_activity_at: now,
      is_owner: true,
      owner: {
        id_usuario: Number(currentUser?.['id_usuario'] ?? 0),
        nombre: this.currentUserName(),
        icon_path: typeof currentUser?.['icon_path'] === 'string' ? currentUser['icon_path'] : null,
        updated_at: typeof currentUser?.['updated_at'] === 'string' ? currentUser['updated_at'] : null,
      },
      comments: [],
    };
  }

  private buildOptimisticComment(mensaje: string): ForumComment {
    const now = new Date().toISOString();
    const currentUser = this.user();

    return {
      id_linea_foro: this.temporaryCommentId--,
      id_foro: this.selectedForum!.id_foro,
      id_usuario: Number(currentUser?.['id_usuario'] ?? 0),
      mensaje,
      fecha: now,
      created_at: now,
      updated_at: now,
      autor_nombre: this.currentUserName(),
      autor_icon_path: typeof currentUser?.['icon_path'] === 'string' ? currentUser['icon_path'] : null,
      autor_updated_at: typeof currentUser?.['updated_at'] === 'string' ? currentUser['updated_at'] : null,
      can_edit: true,
      can_delete: true,
    };
  }
}
