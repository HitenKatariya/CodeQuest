import React, { useState } from 'react';
import { useSelector } from 'react-redux';
import Avatar from '../Avatar/Avatar';
import { useLanguage } from '../../utils/LanguageContext';
import { likePost, commentPost } from '../../api';
import moment from 'moment';
import './Post.css';

const Post = ({ post, onUpdate }) => {
  const [comment, setComment] = useState('');
  const [isExpanded, setIsExpanded] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const { translate } = useLanguage();
  const user = useSelector(state => state.currentuserreducer);

  const handleLike = async () => {
    try {
      if (!user?.result) {
        setError('Please log in to like posts');
        return;
      }

      await likePost(post._id);
      if (onUpdate) {
        onUpdate();
      }
    } catch (error) {
      console.error('Error liking post:', error);
      setError(error?.response?.data?.message || 'Failed to like post');
    }
  };

  const handleComment = async (e) => {
    e.preventDefault();
    if (!comment.trim()) return;

    if (!user?.result) {
      setError('Please log in to comment');
      return;
    }

    try {
      setIsSubmitting(true);
      await commentPost(post._id, { text: comment });
      setComment('');
      if (onUpdate) {
        onUpdate();
      }
    } catch (error) {
      console.error('Error commenting:', error);
      setError(error?.response?.data?.message || 'Failed to add comment');
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderMedia = () => {
    if (post.image) {
      return (
        <div className="post-media">
          <img 
            src={post.image} 
            alt="Post content" 
            loading="lazy"
            onError={(e) => {
              e.target.onerror = null;
              e.target.src = 'https://via.placeholder.com/400x300?text=Image+not+available';
            }}
          />
        </div>
      );
    } else if (post.video) {
      return (
        <div className="post-media">
          <video controls playsInline>
            <source src={post.video} type="video/mp4" />
            {translate('Your browser does not support the video tag.')}
          </video>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="post">
      <div className="post-header">
        <div className="post-user">
          <Avatar user={post.user} size="40" />
          <div className="user-info">
            <h4>{post.user.name}</h4>
            <small>{moment(post.createdAt).fromNow()}</small>
          </div>
        </div>
      </div>

      <div className="post-content">
        <p>{post.content}</p>
        {renderMedia()}
      </div>

      {error && <p className="error-message">{error}</p>}

      <div className="post-actions">
        <button 
          className={`action-btn ${post.likes.includes(user?.result?._id) ? 'liked' : ''}`}
          onClick={handleLike}
          disabled={isSubmitting}
        >
          <i className="fas fa-heart"></i>
          <span>{post.likes.length} {translate('Likes')}</span>
        </button>
        <button 
          className="action-btn"
          onClick={() => setIsExpanded(!isExpanded)}
        >
          <i className="fas fa-comment"></i>
          <span>{post.comments.length} {translate('Comments')}</span>
        </button>
      </div>

      {isExpanded && (
        <div className="comments-section">
          <form onSubmit={handleComment} className="comment-form">
            <input
              type="text"
              placeholder={translate('Write a comment...')}
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              disabled={isSubmitting}
            />
            <button 
              type="submit" 
              disabled={!comment.trim() || isSubmitting}
              className={isSubmitting ? 'submitting' : ''}
            >
              {isSubmitting ? (
                <span className="spinner"></span>
              ) : (
                translate('Post')
              )}
            </button>
          </form>
          
          <div className="comments-list">
            {post.comments.map((comment, index) => (
              <div key={index} className="comment">
                <Avatar 
                  user={comment.user}
                  size="32"
                />
                <div className="comment-content">
                  <h5>{comment.user.name}</h5>
                  <p>{comment.text}</p>
                  <small>{moment(comment.createdAt).fromNow()}</small>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default Post;
