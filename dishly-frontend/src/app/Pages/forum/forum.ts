import { CommonModule } from '@angular/common';
import { AfterViewChecked, Component, ElementRef, OnDestroy, OnInit, ViewChild, computed, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { AuthServices } from '../../Core/Services/Auth/auth-services';
import { ForumService } from '../../Core/Services/Forum/forum.service';
import { ForumComment, ForumDetail, ForumOwner, ForumSummary } from '../../Core/Interfaces/Forum';
import { DeletePostModal } from '../../Core/Components/modals/delete-post-modal/delete-post-modal';
import { Breadcrumbs } from '../../Core/Components/breadcrumbs/breadcrumbs';

@Component({
  selector: 'app-forum',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, DeletePostModal, Breadcrumbs],
  templateUrl: './forum.html',
  styleUrl: './forum.css',
})
export class Forum implements OnInit, AfterViewChecked, OnDestroy {
  private readonly forumService = inject(ForumService);
  private readonly authService = inject(AuthServices);
  private readonly commentsPerPage = 30;

  protected readonly user = toSignal<Record<string, unknown> | null>(this.authService.user$, { initialValue: null });
  protected readonly isAuthenticated = computed(() => !!this.user());
  protected readonly currentUserRole = computed(() => String(this.user()?.['rol'] ?? ''));
  protected readonly isAdmin = computed(() => this.currentUserRole() === 'admin');
  protected readonly currentUserName = computed(() => String(this.user()?.['nombre'] ?? this.user()?.['name'] ?? 'Dishly User'));

  // Sirve para obtener la URL del icono del usuario autenticado
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
  protected forumActionError: string | null = null;

  protected creatingForum = false;
  protected newForumTitle = '';
  protected newForumDescription = '';
  protected createForumError: string | null = null;

  protected editingForum = false;
  protected updatingForum = false;
  protected deletingForum = false;
  protected editingForumTitle = '';
  protected editingForumDescription = '';

  protected postingComment = false;
  protected newComment = '';
  protected commentError: string | null = null;

  protected editingCommentId: number | null = null;
  protected editingCommentMessage = '';
  protected savingEditedComment = false;
  protected deletingCommentId: number | null = null;
  protected loadingMoreComments = false;
  protected hasMoreComments = false;
  private nextCommentsPage = 2;

  protected deleteModalOpen = false;
  private pendingDeleteComment: ForumComment | null = null;
  protected deletePostModalOpen = false;

  private temporaryForumId = -1;
  private temporaryCommentId = -1;
  private conversationPanelEl: HTMLElement | null = null;
  private commentPanelEl: HTMLElement | null = null;
  private panelsResizeObserver: ResizeObserver | null = null;
  private shouldSyncPanels = false;

  // Sirve para obtener el panel de conversación
  @ViewChild('forumConversationPanel')
  private set forumConversationPanelRef(panel: ElementRef<HTMLElement> | undefined) {
    this.conversationPanelEl = panel?.nativeElement ?? null;
    this.attachPanelsObserver();
  }

  // Sirve para obtener el panel de comentarios
  @ViewChild('forumCommentPanel')
  private set forumCommentPanelRef(panel: ElementRef<HTMLElement> | undefined) {
    this.commentPanelEl = panel?.nativeElement ?? null;
    this.attachPanelsObserver();
  }

  // Sirve para iniciar el componente
  ngOnInit(): void {
    this.loadForums();
  }

  // Sirve para cargar los foros
  protected loadForums(selectedForumId?: number): void {
    this.loadingForums = true;
    this.sidebarError = null;

    // Sirve para obtener los foros
    this.forumService.getForums().subscribe({
      next: (forums) => {
        this.forums = forums;
        this.loadingForums = false;
        this.sidebarError = null;

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

        if (this.forums.length === 0) {
          this.selectedForum = null;
        }
      }
    });
  }

  // Sirve para seleccionar un foro
  protected selectForum(forumId: number, forceReload: boolean = true): void {
    if (!forceReload && this.selectedForum?.id_foro === forumId) {
      return;
    }

    this.loadingForum = true;
    this.detailError = null;
    this.forumActionError = null;
    this.editingCommentId = null;
    this.commentError = null;
    this.editingForum = false;

    // Sirve para obtener el foro
    this.forumService.getForum(forumId, 1, this.commentsPerPage).subscribe({
      next: (forum) => {
        this.selectedForum = forum;
        this.loadingForum = false;
        this.upsertForumSummary(forum);
        this.syncCommentsPagination(forum);
      },
      error: (error) => {
        this.loadingForum = false;
        this.detailError = error?.error?.message ?? 'Could not load this discussion.';
      }
    });
  }

  // Sirve para crear un foro
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

    if (this.isDuplicatedForumTitle(titulo)) {
      this.createForumError = 'A forum with this title already exists. Please choose a different title.';
      return;
    }

    this.creatingForum = true;
    this.createForumError = null;

    const optimisticForum = this.buildOptimisticForum(titulo, descripcion);
    const previousSelectedForum = this.selectedForum;
    const previousForums = [...this.forums];

    this.selectedForum = optimisticForum;
    this.upsertForumSummary(optimisticForum, true);

    // Sirve para crear el foro
    this.forumService.createForum({ titulo, descripcion }).subscribe({
      next: (forum) => {
        this.creatingForum = false;
        this.newForumTitle = '';
        this.newForumDescription = '';
        this.sidebarError = null;
        this.selectedForum = forum;
        this.upsertForumSummary(forum, true);
        this.loadForums(forum.id_foro);
      },
      error: (error) => {
        this.creatingForum = false;
        this.selectedForum = previousSelectedForum;
        this.forums = previousForums;
        this.createForumError = this.extractErrorMessage(error, 'Could not create the forum.');
      }
    });
  }

  // Sirve para cerrar el formulario de creación de foro
  protected closeCreateForm(): void {
    this.newForumTitle = '';
    this.newForumDescription = '';
    this.createForumError = null;
    this.selectedForum = null;
  }

  // Sirve para sincronizar los paneles
  ngAfterViewChecked(): void {
    if (!this.shouldSyncPanels) {
      return;
    }

    this.syncPanelsHeight();
    this.shouldSyncPanels = false;
  }

  // Sirve para destruir el componente
  ngOnDestroy(): void {
    this.panelsResizeObserver?.disconnect();
  }

  // Sirve para enviar un comentario
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

    // Sirve para actualizar el foro
    this.selectedForum = {
      ...this.selectedForum,
      comments: [...this.selectedForum.comments, optimisticComment],
      comments_count: (this.selectedForum.comments_count ?? this.selectedForum.comments.length) + 1,
      last_activity_at: optimisticComment.created_at ?? optimisticComment.fecha,
    };
    this.bumpSummaryCommentCount(this.selectedForum.id_foro, 1, optimisticComment.created_at ?? optimisticComment.fecha);
    this.newComment = '';

    // Sirve para crear el comentario
    this.forumService.createComment(this.selectedForum.id_foro, mensaje).subscribe({
      next: ({ comment }) => {
        this.postingComment = false;

        // Sirve para actualizar el foro
        this.selectedForum = {
          ...this.selectedForum!,
          comments: this.selectedForum!.comments.map((item) =>
            item.id_linea_foro === optimisticComment.id_linea_foro ? comment : item
          ),
          comments_count: this.selectedForum!.comments.length,
          last_activity_at: comment.created_at ?? comment.fecha,
        };

        this.updateCommentsMeta(1);
        this.syncForumSummary(this.selectedForum);
      },
      error: (error) => {
        this.postingComment = false;
        this.selectedForum = {
          ...this.selectedForum!,
          comments: this.selectedForum!.comments.filter((item) => item.id_linea_foro !== optimisticComment.id_linea_foro),
          comments_count: Math.max(0, (this.selectedForum!.comments_count ?? this.selectedForum!.comments.length) - 1),
        };
        this.updateCommentsMeta(-1);
        this.bumpSummaryCommentCount(this.selectedForum.id_foro, -1, this.selectedForum.last_activity_at ?? null);
        this.newComment = mensaje;
        this.commentError = this.extractErrorMessage(error, 'Could not publish the comment.');
      }
    });
  }

  // Sirve para iniciar la edición de un comentario
  protected startEditing(comment: ForumComment): void {
    this.editingCommentId = comment.id_linea_foro;
    this.editingCommentMessage = comment.mensaje;
    this.commentError = null;
  }

  // Sirve para cancelar la edición de un comentario
  protected cancelEditing(): void {
    this.editingCommentId = null;
    this.editingCommentMessage = '';
    this.savingEditedComment = false;
  }

  // Sirve para guardar la edición de un comentario
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

    // Sirve para actualizar el comentario
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

  // Sirve para eliminar un comentario
  protected deleteComment(comment: ForumComment): void {
    if (!this.selectedForum) {
      return;
    }

    this.pendingDeleteComment = comment;
    this.deleteModalOpen = true;
  }

  // Sirve para cancelar la eliminación de un comentario
  protected cancelDeleteModal(): void {
    this.deleteModalOpen = false;
    this.pendingDeleteComment = null;
  }

  // Sirve para confirmar la eliminación de un comentario
  protected confirmDelete(): void {
    const comment = this.pendingDeleteComment;
    if (!comment || !this.selectedForum) {
      this.cancelDeleteModal();
      return;
    }

    this.deleteModalOpen = false;
    this.pendingDeleteComment = null;
    this.deletingCommentId = comment.id_linea_foro;
    this.commentError = null;

    // Sirve para eliminar el comentario
    this.forumService.deleteComment(this.selectedForum.id_foro, comment.id_linea_foro).subscribe({
      next: () => {
        // Sirve para actualizar el foro
        this.selectedForum = {
          ...this.selectedForum!,
          comments: this.selectedForum!.comments.filter((item) => item.id_linea_foro !== comment.id_linea_foro),
        };

        this.updateCommentsMeta(-1);
        this.bumpSummaryCommentCount(this.selectedForum.id_foro, -1, this.selectedForum.last_activity_at ?? null);
        this.deletingCommentId = null;
      },
      error: (error) => {
        this.deletingCommentId = null;
        this.commentError = this.extractErrorMessage(error, 'Could not delete the comment.');
      }
    });
  }

  // Sirve para validar si el foro está seleccionado
  protected isSelected(forumId: number): boolean {
    return this.selectedForum?.id_foro === forumId;
  }

  // Sirve para cargar más comentarios
  protected loadMoreComments(): void {
    if (!this.selectedForum || this.loadingMoreComments || !this.hasMoreComments) {
      return;
    }

    this.loadingMoreComments = true;
    this.forumActionError = null;

    // Sirve para obtener el foro
    this.forumService.getForum(this.selectedForum.id_foro, this.nextCommentsPage, this.commentsPerPage).subscribe({
      next: (forumPage) => {
        if (!this.selectedForum || this.selectedForum.id_foro !== forumPage.id_foro) {
          this.loadingMoreComments = false;
          return;
        }

        // Sirve para actualizar el foro
        this.selectedForum = {
          ...this.selectedForum,
          comments: this.mergeComments(this.selectedForum.comments, forumPage.comments),
          comments_meta: forumPage.comments_meta,
          comments_count: forumPage.comments_count,
          last_activity_at: forumPage.last_activity_at,
        };

        this.loadingMoreComments = false;
        this.syncCommentsPagination(this.selectedForum);
      },
      error: (error) => {
        this.loadingMoreComments = false;
        this.forumActionError = this.extractErrorMessage(error, 'Could not load more comments.');
      }
    });
  }

  // Sirve para iniciar la edición de un foro
  protected startEditingForum(): void {
    if (!this.selectedForum?.is_owner) {
      return;
    }

    this.editingForum = true;
    this.forumActionError = null;
    this.editingForumTitle = this.selectedForum.titulo;
    this.editingForumDescription = this.selectedForum.descripcion;
  }

  // Sirve para cancelar la edición de un foro
  protected cancelEditingForum(): void {
    this.editingForum = false;
    this.updatingForum = false;
    this.editingForumTitle = '';
    this.editingForumDescription = '';
  }

  // Sirve para guardar la edición de un foro
  protected saveForumChanges(): void {
    if (!this.selectedForum || !this.selectedForum.is_owner) {
      return;
    }

    const titulo = this.editingForumTitle.trim();
    const descripcion = this.editingForumDescription.trim();

    if (!titulo || !descripcion) {
      this.forumActionError = 'Title and description are required.';
      return;
    }

    if (this.isDuplicatedForumTitle(titulo, this.selectedForum.id_foro)) {
      this.forumActionError = 'A forum with this title already exists. Please choose a different title.';
      return;
    }

    this.updatingForum = true;
    this.forumActionError = null;

    // Sirve para actualizar el foro
    this.forumService.updateForum(this.selectedForum.id_foro, { titulo, descripcion }).subscribe({
      next: (forum) => {
        this.updatingForum = false;

        this.selectedForum = {
          ...forum,
          comments: this.selectedForum?.comments ?? forum.comments,
          comments_meta: this.selectedForum?.comments_meta ?? forum.comments_meta,
        };

        this.upsertForumSummary(this.selectedForum, true);
        this.cancelEditingForum();
      },
      error: (error) => {
        this.updatingForum = false;
        this.forumActionError = this.extractErrorMessage(error, 'Could not update this forum.');
      }
    });
  }

  // Sirve para eliminar un foro
  protected deleteForum(): void {
    if (!this.selectedForum || !this.selectedForum.is_owner || this.deletingForum) {
      return;
    }
    this.deletePostModalOpen = true;
  }

  // Sirve para cancelar la eliminación de un foro
  protected cancelDeletePostModal(): void {
    this.deletePostModalOpen = false;
  }

  // Sirve para confirmar la eliminación de un foro
  protected confirmDeleteForum(): void {
    if (!this.selectedForum || !this.selectedForum.is_owner || this.deletingForum) {
      this.deletePostModalOpen = false;
      return;
    }

    this.deletePostModalOpen = false;
    this.deletingForum = true;
    this.forumActionError = null;

    const forumId = this.selectedForum.id_foro;

    // Sirve para eliminar el foro
    this.forumService.deleteForum(forumId).subscribe({
      next: () => {
        this.deletingForum = false;
        this.cancelEditingForum();
        this.forums = this.forums.filter((forum) => forum.id_foro !== forumId);

        const nextForumId = this.forums[0]?.id_foro;
        if (nextForumId) {
          this.selectForum(nextForumId, true);
          return;
        }

        this.selectedForum = null;
      },
      error: (error) => {
        this.deletingForum = false;
        this.forumActionError = this.extractErrorMessage(error, 'Could not delete this forum.');
      }
    });
  }

  // Sirve para obtener la URL del icono del propietario del foro
  protected getOwnerAvatar(owner: ForumOwner): string | null {
    if (!owner.icon_path) {
      return null;
    }

    return this.authService.getAssetUrl(owner.icon_path, owner.updated_at ?? undefined);
  }

  // Sirve para obtener la URL del icono del autor del comentario
  protected getCommentAvatar(comment: ForumComment): string | null {
    if (!comment.autor_icon_path) {
      return null;
    }

    return this.authService.getAssetUrl(comment.autor_icon_path, comment.autor_updated_at ?? undefined);
  }

  // Sirve para formatear la fecha
  protected formatDate(value?: string | null): string {
    if (!value) {
      return 'Unknown date';
    }

    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
      return value;
    }

    // Sirve para formatear la fecha
    return new Intl.DateTimeFormat('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  }

  // Sirve para obtener las iniciales del propietario del foro
  protected ownerInitial(name: string | undefined | null): string {
    return (name?.trim().charAt(0) || 'D').toUpperCase();
  }

  // Sirve para sincronizar el resumen del foro
  private syncForumSummary(forum: ForumDetail): void {
    this.upsertForumSummary(forum);
  }

  // Sirve para actualizar el contador de comentarios del foro
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

  // Sirve para actualizar el resumen del foro
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

  // Sirve para ordenar los foros por actividad
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

  // Sirve para extraer el mensaje de error
  private extractErrorMessage(error: any, fallback: string): string {
    const validationMessage = Object.values(error?.error?.errors ?? {})
      .flat()
      .find((value) => typeof value === 'string');

    return String(validationMessage ?? error?.error?.message ?? fallback);
  }

  // Sirve para validar si el título del foro es duplicado
  private isDuplicatedForumTitle(candidateTitle: string, ignoreForumId?: number): boolean {
    const normalizedCandidate = this.normalizeForumTitle(candidateTitle);

    if (!normalizedCandidate) {
      return false;
    }

    return this.forums
      .filter((forum) => forum.id_foro !== ignoreForumId)
      .some((forum) => this.normalizeForumTitle(forum.titulo) === normalizedCandidate);
  }

  // Sirve para sincronizar la paginación de comentarios
  private syncCommentsPagination(forum: ForumDetail): void {
    const currentPage = Number(forum.comments_meta?.current_page ?? 1);
    this.hasMoreComments = Boolean(forum.comments_meta?.has_more);
    this.nextCommentsPage = currentPage + 1;
  }

  // Sirve para fusionar los comentarios
  private mergeComments(existing: ForumComment[], incoming: ForumComment[]): ForumComment[] {
    const byId = new Map<number, ForumComment>();

    // Sirve para agregar los comentarios existentes al mapa
    for (const comment of existing) {
      byId.set(comment.id_linea_foro, comment);
    }

    // Sirve para agregar los comentarios nuevos al mapa
    for (const comment of incoming) {
      byId.set(comment.id_linea_foro, comment);
    }

    // Sirve para ordenar los comentarios por ID
    return [...byId.values()].sort((left, right) => left.id_linea_foro - right.id_linea_foro);
  }

  // Sirve para actualizar las metas de los comentarios
  private updateCommentsMeta(delta: number): void {
    if (!this.selectedForum?.comments_meta) {
      return;
    }

    const total = Math.max(0, Number(this.selectedForum.comments_meta.total ?? 0) + delta);
    this.selectedForum = {
      ...this.selectedForum,
      comments_meta: {
        ...this.selectedForum.comments_meta,
        total,
      },
    };
  }

  // Sirve para normalizar el título del foro
  private normalizeForumTitle(value: string): string {
    return value
      .trim()
      .replace(/\s+/g, ' ')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase();
  }

  // Sirve para crear un foro
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

  // Sirve para crear un comentario
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

  // Sirve para sincronizar los paneles
  private attachPanelsObserver(): void {
    if (typeof ResizeObserver === 'undefined') {
      return;
    }

    this.panelsResizeObserver?.disconnect();

    if (!this.conversationPanelEl || !this.commentPanelEl) {
      return;
    }

    // Sirve para crear el observador de los paneles
    this.panelsResizeObserver = new ResizeObserver(() => {
      this.syncPanelsHeight();
    });

    // Sirve para observar los paneles
    this.panelsResizeObserver.observe(this.conversationPanelEl);
    this.panelsResizeObserver.observe(this.commentPanelEl);
    this.shouldSyncPanels = true;
  }

  // Sirve para sincronizar la altura de los paneles
  private syncPanelsHeight(): void {
    if (!this.conversationPanelEl || !this.commentPanelEl) {
      return;
    }

    this.conversationPanelEl.style.height = '';
    this.commentPanelEl.style.height = '';
  }
}
