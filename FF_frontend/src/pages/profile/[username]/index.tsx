import { useRouter } from 'next/router';
import { NextPageWithLayout } from '@/pages/_app';

import MarketplaceNavbar from '@/components/specific/marketplace/navbar';
import Profile from '@/components/specific/profile/profile';
import Footer from '@/components/specific/marketplace/footer';

import classes from './profile.module.css';

const ProfilePage: NextPageWithLayout = function () {
    const router = useRouter();
    const username = router.query.username;

    if (typeof username === 'string') return <Profile username={ username } />;

    return <></>;
};

export default ProfilePage;

ProfilePage.getLayout = function (page) {
    return (
        <div className={ classes.container }>
            <MarketplaceNavbar />
            { page }
            <Footer />
        </div>
    );
};
