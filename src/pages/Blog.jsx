import { useState, useEffect } from 'react';
import { collection, query, getDocs, orderBy } from 'firebase/firestore';
import { db } from '../firebase';

export default function Blog() {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchPosts = async () => {
      try {
        const postsRef = collection(db, 'posts');
        const q = query(postsRef, orderBy('date', 'desc'));
        const querySnapshot = await getDocs(q);
        const fetchedPosts = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setPosts(fetchedPosts);
        setLoading(false);
      } catch (err) {
        console.error("Error loading blog posts from Firestore: ", err);
        setError('Unable to load blog posts at this time.');
        setLoading(false);
      }
    };
    
    fetchPosts();
  }, []);

  return (
    <main>
      <section className="section">
        <div className="container">
          <div className="section-header">
            <h1>UCDS Blog Posts.</h1>
          </div>
          <p className="section-copy">
            Our stories, insights and general thoughts on debate and the community. Read about meetings, trips, events and more.
          </p>

          <div id="blogList" className="cards feature-grid" style={{ marginTop: '2rem' }}>
            {loading && <p className="section-copy">Loading articles...</p>}
            {error && <p className="section-copy" style={{ color: '#f87171' }}>{error}</p>}
            {!loading && !error && posts.length === 0 && (
              <p className="section-copy">No blog posts are available at the moment. Check back later for updates.</p>
            )}
            {!loading && !error && posts.map((post) => (
              <article key={post.id || post.title} className="card blog-card" style={{ marginBottom: '2rem', background: '#ffffff', color: '#334155', padding: '2rem', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                <div className="blog-meta" style={{ marginBottom: '0.75rem', fontSize: '0.85rem', color: '#64748b' }}>
                  <span className="blog-date">{post.date}</span>
                </div>
                <h3 style={{ marginTop: 0, fontSize: '1.5rem', color: '#1e3a8a', marginBottom: '1rem', fontWeight: 700 }}>
                  {post.title}
                </h3>
                <details style={{ width: '100%' }}>
                  <summary style={{ cursor: 'pointer', fontWeight: 'bold', marginBottom: '1rem', color: '#2563eb', outline: 'none' }}>
                    Read Article
                  </summary>
                  <div 
                    className="blog-content" 
                    style={{ marginTop: '1rem', lineHeight: '1.6', color: '#334155' }}
                    dangerouslySetInnerHTML={{ __html: post.content || post.summary }}
                  />
                </details>
              </article>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
