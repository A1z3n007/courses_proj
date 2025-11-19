import React, { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../api';

/**
 * ProfilePage allows the user to view and edit their profile, including
 * extended fields stored in the Profile model. On initial render it
 * loads the current user data; on submit it sends a PUT request to
 * update both User and Profile fields.
 */
export default function ProfilePage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [data, setData] = useState({
    first_name: '',
    last_name: '',
    email: '',
    profile: {
      department: '',
      mentor_name: '',
      date_joined_company: '',
      city: '',
      avatar: '',
    },
  });

  useEffect(() => {
    async function fetchProfile() {
      try {
        const resp = await api.get('/accounts/profile/');
        // Ensure nested profile exists
        const profileData = resp.data.profile || {
          department: '',
          mentor_name: '',
          date_joined_company: '',
          city: '',
          avatar: '',
        };
        setData({
          first_name: resp.data.first_name || '',
          last_name: resp.data.last_name || '',
          email: resp.data.email || '',
          profile: profileData,
        });
      } catch (err) {
        setError('Failed to load profile');
      } finally {
        setLoading(false);
      }
    }
    fetchProfile();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name.startsWith('profile.')) {
      const field = name.split('.')[1];
      setData((prev) => ({
        ...prev,
        profile: { ...prev.profile, [field]: value },
      }));
    } else {
      setData((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    try {
      await api.put('/accounts/profile/', data);
      setSuccess('Profile updated successfully');
    } catch (err) {
      setError('Failed to update profile');
    }
  };

  if (loading) return <p>Loading...</p>;

  return (
    <div style={{ maxWidth: '600px', margin: '2rem auto' }}>
      <h2>Edit Profile</h2>
      <Link to="/">Back to Dashboard</Link>
      <form onSubmit={handleSubmit} style={{ marginTop: '1rem' }}>
        <div style={{ marginBottom: '1rem' }}>
          <label>First name</label>
          <input
            type="text"
            name="first_name"
            value={data.first_name}
            onChange={handleChange}
            style={{ width: '100%', padding: '0.5rem' }}
          />
        </div>
        <div style={{ marginBottom: '1rem' }}>
          <label>Last name</label>
          <input
            type="text"
            name="last_name"
            value={data.last_name}
            onChange={handleChange}
            style={{ width: '100%', padding: '0.5rem' }}
          />
        </div>
        <div style={{ marginBottom: '1rem' }}>
          <label>Email</label>
          <input
            type="email"
            name="email"
            value={data.email}
            onChange={handleChange}
            style={{ width: '100%', padding: '0.5rem' }}
          />
        </div>
        {/* Profile fields */}
        <div style={{ marginBottom: '1rem' }}>
          <label>Department</label>
          <input
            type="text"
            name="profile.department"
            value={data.profile.department}
            onChange={handleChange}
            style={{ width: '100%', padding: '0.5rem' }}
          />
        </div>
        <div style={{ marginBottom: '1rem' }}>
          <label>Mentor Name</label>
          <input
            type="text"
            name="profile.mentor_name"
            value={data.profile.mentor_name}
            onChange={handleChange}
            style={{ width: '100%', padding: '0.5rem' }}
          />
        </div>
        <div style={{ marginBottom: '1rem' }}>
          <label>Date Joined Company</label>
          <input
            type="date"
            name="profile.date_joined_company"
            value={data.profile.date_joined_company || ''}
            onChange={handleChange}
            style={{ width: '100%', padding: '0.5rem' }}
          />
        </div>
        <div style={{ marginBottom: '1rem' }}>
          <label>City</label>
          <input
            type="text"
            name="profile.city"
            value={data.profile.city}
            onChange={handleChange}
            style={{ width: '100%', padding: '0.5rem' }}
          />
        </div>
        <div style={{ marginBottom: '1rem' }}>
          <label>Avatar</label>
          <select
            name="profile.avatar"
            value={data.profile.avatar}
            onChange={handleChange}
            style={{ width: '100%', padding: '0.5rem' }}
          >
            <option value="">Select avatar</option>
            <option value="robot">Robot</option>
            <option value="astronaut">Astronaut</option>
            <option value="worker">Worker</option>
            <option value="manager">Manager</option>
            <option value="seller">Seller</option>
          </select>
        </div>
        {error && <p style={{ color: 'red' }}>{error}</p>}
        {success && <p style={{ color: 'green' }}>{success}</p>}
        <button type="submit" style={{ padding: '0.5rem 1rem' }}>Save</button>
      </form>
    </div>
  );
}