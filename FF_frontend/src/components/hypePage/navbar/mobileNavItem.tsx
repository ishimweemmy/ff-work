import classes from './navItem.module.css';
import NavLink from './navLink';

type NavItemProps = {
    to: string;
    name: string;
};

export default function MobileNavItem(props: NavItemProps) {
    return (
        <li className={ classes.mobileListItem }>
            <NavLink
                to={ props.to }
                className={ (navData) =>
                    `${navData.isActive ? classes.navbarLinkActive : ''} ${
                        classes.navbarLink
                    } ${classes.mobileNavbarLink}`
                }
            >
                { props.name }
            </NavLink>
        </li>
    );
}
