// ========================================
// Mini Net - Social Media Platform App
// ========================================

// ============ Data Models ============

// starts here

class Post {
    constructor(id, text, imageUrl, username, avatar, timestamp) {
        this.id = id;
        this.text = text;
        this.imageUrl = imageUrl;
        this.username = username;
        this.avatar = avatar;
        this.timestamp = timestamp;
        this.likes = [];
        this.comments = [];
    }
}

class Comment {
    constructor(id, text, username, avatar, timestamp) {
        this.id = id;
        this.text = text;
        this.username = username;
        this.avatar = avatar;
        this.timestamp = timestamp;
    }
}

// ============ Post Manager ============

class PostManager {
    constructor() {
        this.posts = [];
        this.currentUser = {
            id: 'user_' + Date.now(),
            username: 'You',
            avatar: this.generateAvatar('U')
        };
        this.loadFromStorage();
    }

    generateAvatar(letter) {
        const colors = ['#ff6b6b', '#4ecdc4', '#45b7d1', '#96ceb4', '#ffeaa7', '#dfe6e9', '#fd79a8', '#6c5ce7'];
        const color = colors[Math.floor(Math.random() * colors.length)];
        return `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Ccircle cx='50' cy='50' r='50' fill='${encodeURIComponent(color)}'/%3E%3Ctext x='50' y='55' font-size='35' text-anchor='middle' fill='white' font-family='Arial'%3E${letter.toUpperCase()}%3C/text%3E%3C/svg%3E`;
    }

    generateId() {
        return 'post_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }

    createPost(text, imageUrl) {
        if (!text.trim() && !imageUrl) return null;

        const post = new Post(
            this.generateId(),
            text.trim(),
            imageUrl,
            this.currentUser.username,
            this.currentUser.avatar,
            new Date().toISOString()
        );

        this.posts.unshift(post);
        this.saveToStorage();
        return post;
    }

    deletePost(postId) {
        const index = this.posts.findIndex(p => p.id === postId);
        if (index > -1) {
            this.posts.splice(index, 1);
            this.saveToStorage();
            return true;
        }
        return false;
    }

    toggleLike(postId) {
        const post = this.posts.find(p => p.id === postId);
        if (post) {
            const userId = this.currentUser.id;
            const likeIndex = post.likes.indexOf(userId);
            
            if (likeIndex > -1) {
                post.likes.splice(likeIndex, 1);
            } else {
                post.likes.push(userId);
            }
            
            this.saveToStorage();
            return post.likes.includes(userId);
        }
        return false;
    }

    isLiked(postId) {
        const post = this.posts.find(p => p.id === postId);
        return post ? post.likes.includes(this.currentUser.id) : false;
    }

    addComment(postId, text) {
        const post = this.posts.find(p => p.id === postId);
        if (post && text.trim()) {
            const comment = new Comment(
                'comment_' + Date.now(),
                text.trim(),
                this.currentUser.username,
                this.currentUser.avatar,
                new Date().toISOString()
            );
            post.comments.push(comment);
            this.saveToStorage();
            return comment;
        }
        return null;
    }

    getComments(postId) {
        const post = this.posts.find(p => p.id === postId);
        return post ? post.comments : [];
    }

    saveToStorage() {
        try {
            localStorage.setItem('miniNetPosts', JSON.stringify(this.posts));
            localStorage.setItem('miniNetUser', JSON.stringify(this.currentUser));
        } catch (e) {
            console.warn('Could not save to localStorage:', e);
        }
    }

    loadFromStorage() {
        try {
            const savedPosts = localStorage.getItem('miniNetPosts');
            const savedUser = localStorage.getItem('miniNetUser');
            
            if (savedPosts) {
                this.posts = JSON.parse(savedPosts);
            }
            
            if (savedUser) {
                this.currentUser = JSON.parse(savedUser);
            }
        } catch (e) {
            console.warn('Could not load from localStorage:', e);
        }
    }
}

// ============ UI Controller ============

class UIController {
    constructor(postManager) {
        this.postManager = postManager;
        this.currentPostId = null;
        this.imageData = null;
        
        this.initElements();
        this.initEventListeners();
        this.render();
    }

    initElements() {
        // Header elements
        this.feedBtn = document.getElementById('feedBtn');
        this.createBtn = document.getElementById('createBtn');
        
        // Create post elements
        this.createPostSection = document.getElementById('createPostSection');
        this.createUserAvatar = document.getElementById('createUserAvatar');
        this.postText = document.getElementById('postText');
        this.imageInput = document.getElementById('imageInput');
        this.imageUploadArea = document.getElementById('imageUploadArea');
        this.uploadPlaceholder = document.getElementById('uploadPlaceholder');
        this.imagePreviewContainer = document.getElementById('imagePreviewContainer');
        this.imagePreview = document.getElementById('imagePreview');
        this.removeImageBtn = document.getElementById('removeImageBtn');
        this.addPhotoBtn = document.getElementById('addPhotoBtn');
        this.postBtn = document.getElementById('postBtn');
        
        // Feed elements
        this.feedSection = document.getElementById('feedSection');
        this.feedContainer = document.getElementById('feedContainer');
        this.emptyFeed = document.getElementById('emptyFeed');
        this.createFirstPostBtn = document.getElementById('createFirstPostBtn');
        
        // Modal elements
        this.commentModal = document.getElementById('commentModal');
        this.commentsList = document.getElementById('commentsList');
        this.commentInput = document.getElementById('commentInput');
        this.sendCommentBtn = document.getElementById('sendCommentBtn');
        this.closeModalBtn = document.getElementById('closeModalBtn');
        
        // Toast
        this.toast = document.getElementById('toast');
        this.toastMessage = document.getElementById('toastMessage');
        
        // Set user avatar
        this.createUserAvatar.src = this.postManager.currentUser.avatar;
    }

    initEventListeners() {
        // Navigation
        this.feedBtn.addEventListener('click', () => this.showFeed());
        this.createBtn.addEventListener('click', () => this.focusCreatePost());
        this.createFirstPostBtn.addEventListener('click', () => this.focusCreatePost());
        
        // Image upload
        this.addPhotoBtn.addEventListener('click', () => this.imageInput.click());
        this.imageUploadArea.addEventListener('click', () => this.imageInput.click());
        this.imageInput.addEventListener('change', (e) => this.handleImageSelect(e));
        this.removeImageBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            this.removeImage();
        });
        
        // Drag and drop
        this.imageUploadArea.addEventListener('dragover', (e) => {
            e.preventDefault();
            this.imageUploadArea.classList.add('dragover');
        });
        
        this.imageUploadArea.addEventListener('dragleave', () => {
            this.imageUploadArea.classList.remove('dragover');
        });
        
        this.imageUploadArea.addEventListener('drop', (e) => {
            e.preventDefault();
            this.imageUploadArea.classList.remove('dragover');
            const files = e.dataTransfer.files;
            if (files.length > 0 && files[0].type.startsWith('image/')) {
                this.processImage(files[0]);
            }
        });
        
        // Post button
        this.postBtn.addEventListener('click', () => this.createPost());
        
        // Auto-resize textarea
        this.postText.addEventListener('input', () => {
            this.postText.style.height = 'auto';
            this.postText.style.height = this.postText.scrollHeight + 'px';
        });
        
        // Comment modal
        this.closeModalBtn.addEventListener('click', () => this.closeCommentModal());
        this.commentModal.addEventListener('click', (e) => {
            if (e.target === this.commentModal) {
                this.closeCommentModal();
            }
        });
        
        this.sendCommentBtn.addEventListener('click', () => this.addComment());
        this.commentInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.addComment();
            }
        });
        
        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                this.closeCommentModal();
            }
        });
    }

    showFeed() {
        this.feedBtn.classList.add('active');
        this.createBtn.classList.remove('active');
        this.createPostSection.scrollIntoView({ behavior: 'smooth' });
    }

    focusCreatePost() {
        this.postText.focus();
        this.createPostSection.scrollIntoView({ behavior: 'smooth' });
    }

    handleImageSelect(e) {
        const file = e.target.files[0];
        if (file && file.type.startsWith('image/')) {
            this.processImage(file);
        }
    }

    processImage(file) {
        const reader = new FileReader();
        reader.onload = (e) => {
            this.imageData = e.target.result;
            this.showImagePreview(this.imageData);
        };
        reader.readAsDataURL(file);
    }

    showImagePreview(src) {
        this.imagePreview.src = src;
        this.uploadPlaceholder.style.display = 'none';
        this.imagePreviewContainer.style.display = 'block';
    }

    removeImage() {
        this.imageData = null;
        this.imageInput.value = '';
        this.imagePreview.src = '';
        this.uploadPlaceholder.style.display = 'flex';
        this.imagePreviewContainer.style.display = 'none';
    }

    createPost() {
        const text = this.postText.value;
        const imageUrl = this.imageData;
        
        if (!text.trim() && !imageUrl) {
            this.showToast('Please add some text or an image');
            return;
        }
        
        const post = this.postManager.createPost(text, imageUrl);
        
        if (post) {
            // Clear form
            this.postText.value = '';
            this.postText.style.height = 'auto';
            this.removeImage();
            
            // Render feed
            this.render();
            this.showToast('Post shared successfully! 🎉');
        }
    }

    deletePost(postId) {
        if (this.postManager.deletePost(postId)) {
            this.render();
            this.showToast('Post deleted');
        }
    }

    toggleLike(postId) {
        const isLiked = this.postManager.toggleLike(postId);
        this.updatePostUI(postId);
        return isLiked;
    }

    openCommentModal(postId) {
        this.currentPostId = postId;
        this.renderComments(postId);
        this.commentModal.classList.add('active');
        this.commentInput.focus();
    }

    closeCommentModal() {
        this.commentModal.classList.remove('active');
        this.currentPostId = null;
        this.commentInput.value = '';
    }

    addComment() {
        const text = this.commentInput.value;
        
        if (!text.trim() || !this.currentPostId) return;
        
        const comment = this.postManager.addComment(this.currentPostId, text);
        
        if (comment) {
            this.commentInput.value = '';
            this.renderComments(this.currentPostId);
            this.updatePostUI(this.currentPostId);
        }
    }

    renderComments(postId) {
        const comments = this.postManager.getComments(postId);
        
        if (comments.length === 0) {
            this.commentsList.innerHTML = `
                <div class="no-comments">
                    <p>No comments yet. Be the first to comment!</p>
                </div>
            `;
            return;
        }
        
        this.commentsList.innerHTML = comments.map(comment => `
            <div class="comment-item">
                <div class="comment-avatar">
                    <img src="${comment.avatar}" alt="${comment.username}">
                </div>
                <div class="comment-body">
                    <span class="comment-username">${this.escapeHtml(comment.username)}</span>
                    <span class="comment-text">${this.escapeHtml(comment.text)}</span>
                    <div class="comment-time">${this.formatTime(comment.timestamp)}</div>
                </div>
            </div>
        `).join('');
    }

    updatePostUI(postId) {
        const post = this.postManager.posts.find(p => p.id === postId);
        if (!post) return;
        
        const postElement = document.querySelector(`[data-post-id="${postId}"]`);
        if (!postElement) return;
        
        // Update like button
        const likeBtn = postElement.querySelector('.like-btn');
        const isLiked = this.postManager.isLiked(postId);
        
        if (isLiked) {
            likeBtn.classList.add('liked');
            likeBtn.querySelector('svg').innerHTML = `
                <path fill="currentColor" d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
            `;
        } else {
            likeBtn.classList.remove('liked');
            likeBtn.querySelector('svg').innerHTML = `
                <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
            `;
        }
        
        // Update like count
        const likeCount = postElement.querySelector('.like-count');
        likeCount.textContent = `${post.likes.length} like${post.likes.length !== 1 ? 's' : ''}`;
        
        // Update comment count
        const commentCount = postElement.querySelector('.comment-count');
        commentCount.textContent = `${post.comments.length} comment${post.comments.length !== 1 ? 's' : ''}`;
        
        // Update comment preview
        this.updateCommentPreview(postElement, post);
    }

    updateCommentPreview(postElement, post) {
        let commentPreview = postElement.querySelector('.comment-preview');
        
        if (post.comments.length > 0) {
            const lastComment = post.comments[post.comments.length - 1];
            const previewHtml = `
                <div class="preview-comment">
                    <span class="preview-comment-username">${this.escapeHtml(lastComment.username)}</span>
                    <span class="preview-comment-text">${this.escapeHtml(lastComment.text)}</span>
                </div>
                ${post.comments.length > 1 ? `<div class="view-all-comments" onclick="app.openCommentModal('${post.id}')">View all ${post.comments.length} comments</div>` : ''}
            `;
            
            if (commentPreview) {
                commentPreview.innerHTML = previewHtml;
            } else {
                const newPreview = document.createElement('div');
                newPreview.className = 'comment-preview';
                newPreview.innerHTML = previewHtml;
                const postActions = postElement.querySelector('.post-actions');
                postActions.parentNode.insertBefore(newPreview, postActions.nextSibling);
            }
        }
    }

    render() {
        const posts = this.postManager.posts;
        
        if (posts.length === 0) {
            this.feedContainer.innerHTML = '';
            this.emptyFeed.style.display = 'flex';
            return;
        }
        
        this.emptyFeed.style.display = 'none';
        this.feedContainer.innerHTML = posts.map(post => this.renderPost(post)).join('');
        
        // Attach event listeners to new elements
        this.attachPostEventListeners();
    }

    renderPost(post) {
        const isLiked = this.postManager.isLiked(post.id);
        const heartSvg = isLiked 
            ? `<path fill="currentColor" d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>`
            : `<path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>`;
        
        const lastComment = post.comments[post.comments.length - 1];
        
        return `
            <article class="post-card" data-post-id="${post.id}">
                <header class="post-header">
                    <div class="post-user-info">
                        <div class="post-avatar">
                            <img src="${post.avatar}" alt="${this.escapeHtml(post.username)}">
                        </div>
                        <div class="post-user-details">
                            <span class="post-username">${this.escapeHtml(post.username)}</span>
                            <span class="post-timestamp">${this.formatTime(post.timestamp)}</span>
                        </div>
                    </div>
                    <button class="delete-post-btn" data-delete-id="${post.id}">Delete</button>
                </header>
                
                ${post.imageUrl ? `
                    <div class="post-image">
                        <img src="${post.imageUrl}" alt="Post image">
                    </div>
                ` : ''}
                
                ${post.text ? `
                    <div class="post-content">
                        <p class="post-text">${this.escapeHtml(post.text)}</p>
                    </div>
                ` : ''}
                
                <div class="post-actions">
                    <button class="action-btn like-btn ${isLiked ? 'liked' : ''}" data-like-id="${post.id}">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            ${heartSvg}
                        </svg>
                        <span>Like</span>
                    </button>
                    <button class="action-btn comment-btn" data-comment-id="${post.id}">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/>
                        </svg>
                        <span>Comment</span>
                    </button>
                </div>
                
                <div class="post-stats">
                    <span class="like-count">${post.likes.length} like${post.likes.length !== 1 ? 's' : ''}</span>
                    <span class="comment-count">${post.comments.length} comment${post.comments.length !== 1 ? 's' : ''}</span>
                </div>
                
                ${lastComment ? `
                    <div class="comment-preview">
                        <div class="preview-comment">
                            <span class="preview-comment-username">${this.escapeHtml(lastComment.username)}</span>
                            <span class="preview-comment-text">${this.escapeHtml(lastComment.text)}</span>
                        </div>
                        ${post.comments.length > 1 ? `<div class="view-all-comments" onclick="app.openCommentModal('${post.id}')">View all ${post.comments.length} comments</div>` : ''}
                    </div>
                ` : ''}
            </article>
        `;
    }

    attachPostEventListeners() {
        // Like buttons
        document.querySelectorAll('.like-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const postId = btn.dataset.likeId;
                this.toggleLike(postId);
            });
        });
        
        // Comment buttons
        document.querySelectorAll('.comment-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const postId = btn.dataset.commentId;
                this.openCommentModal(postId);
            });
        });
        
        // Delete buttons
        document.querySelectorAll('.delete-post-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const postId = btn.dataset.deleteId;
                if (confirm('Are you sure you want to delete this post?')) {
                    this.deletePost(postId);
                }
            });
        });
    }

    showToast(message) {
        this.toastMessage.textContent = message;
        this.toast.classList.add('active');
        
        setTimeout(() => {
            this.toast.classList.remove('active');
        }, 3000);
    }

    formatTime(timestamp) {
        const date = new Date(timestamp);
        const now = new Date();
        const diffInSeconds = Math.floor((now - date) / 1000);
        
        if (diffInSeconds < 60) {
            return 'Just now';
        } else if (diffInSeconds < 3600) {
            const minutes = Math.floor(diffInSeconds / 60);
            return `${minutes}m ago`;
        } else if (diffInSeconds < 86400) {
            const hours = Math.floor(diffInSeconds / 3600);
            return `${hours}h ago`;
        } else if (diffInSeconds < 604800) {
            const days = Math.floor(diffInSeconds / 86400);
            return `${days}d ago`;
        } else {
            return date.toLocaleDateString('en-US', { 
                month: 'short', 
                day: 'numeric' 
            });
        }
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
}

// ============ Initialize App ============

let app;

document.addEventListener('DOMContentLoaded', () => {
    const postManager = new PostManager();
    app = new UIController(postManager);
    
    // Make openCommentModal available globally for onclick handlers
    window.app = app;
});
