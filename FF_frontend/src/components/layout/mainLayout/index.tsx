import { PropsWithChildren } from 'react';

import MainSidebar from '@/components/layout/mainSidebar';

import classes from './styles.module.css';

export default function MainLayout(props: PropsWithChildren) {
    return (
        <div className={ classes.container }>
            <MainSidebar />

            <main className={ classes.mainContent }>{ props.children }</main>
        </div>
    );
}
