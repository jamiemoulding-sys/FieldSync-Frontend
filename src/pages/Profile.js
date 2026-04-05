import Layout from '../components/Layout';
import { useAuth } from '../hooks/useAuth';

function Profile() {
  const { user } = useAuth();

  return (
    <Layout>
      <div className="space-y-6">

        <h1 className="heading-1">Profile</h1>

        <div className="card">
          <p className="text-gray-400 text-sm">Email</p>
          <p className="text-white mt-1">{user?.email}</p>
        </div>

        <div className="card">
          <p className="text-gray-400 text-sm">Role</p>
          <p className="text-white mt-1">{user?.role}</p>
        </div>

        <div className="card">
          <p className="text-gray-400 text-sm">Plan</p>
          <p className="text-white mt-1">
            {user?.isPro ? 'Pro' : 'Trial'}
          </p>
        </div>

      </div>
    </Layout>
  );
}

export default Profile;