'use client'
import { Disclosure } from '@headlessui/react';
import { Bars3Icon, XMarkIcon } from '@heroicons/react/24/outline';
import { useState, useRef, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { useAppSelector, useAppDispatch } from '@/redux/hooks';
import { useLogoutMutation } from '@/redux/features/authApiSlice';
import { logout as setLogout } from '@/redux/features/authSlice';
import { NavLink } from '@/components/common';

export default function Navbar() {
    const pathname = usePathname();
    const dispatch = useAppDispatch();
    const [isProjectsMenuOpen, setProjectsMenuOpen] = useState(false);
    const menuRef = useRef(null);
    const menuContentRef = useRef(null);
    const [menuTimeout, setMenuTimeout] = useState<NodeJS.Timeout | null>(null);
    const [mouseLeftMenuContent, setMouseLeftMenuContent] = useState(false);

    const [logout] = useLogoutMutation();
    const { isAuthenticated } = useAppSelector(state => state.auth);

    useEffect(() => {
        const handleMouseLeave = () => {
            if (!mouseLeftMenuContent) {
                setMenuTimeout(
                    setTimeout(() => {
                        setProjectsMenuOpen(false);
                    }, 500)
                );
            }
        };

        document.addEventListener('mouseleave', handleMouseLeave);

        return () => {
            document.removeEventListener('mouseleave', handleMouseLeave);
            if (menuTimeout) clearTimeout(menuTimeout);
        };
    }, [mouseLeftMenuContent]);

    const handleMenuContentMouseLeave = () => {
        setMouseLeftMenuContent(true);
    };

    const handleMenuContentMouseEnter = () => {
        setMouseLeftMenuContent(false);
    };

    const handleProjectsMouseEnter = () => {
        if (menuTimeout) clearTimeout(menuTimeout);
        setProjectsMenuOpen(true);
    };

    const handleProjectsMouseLeave = () => {
        setMenuTimeout(
            setTimeout(() => {
                setProjectsMenuOpen(false);
            }, 500)
        );
    };

    const handleLogout = () => {
        logout(undefined)
            .unwrap()
            .then(() => {
                dispatch(setLogout());
            });
    };

    const isSelected = (path: string) => (pathname === path ? true : false);

	const authLinks = (isMobile: boolean) => (
		<>
			<NavLink
				isSelected={isSelected('/dashboard')}
				isMobile={isMobile}
				href='/dashboard'
			>
				Dashboard-NAv
			</NavLink>
			



			{/* Projects sekmesi */}
			<div
				className='relative'
				onMouseEnter={handleProjectsMouseEnter}
				onMouseLeave={handleProjectsMouseLeave}
				ref={menuRef}
			>
				<button
					className='text-gray-300 hover:text-white px-3 py-2'
				>
					Projects
				</button>
				{isProjectsMenuOpen && (
					<div
						className='absolute z-10 -ml-4 mt-2 w-48 bg-gray-800 shadow-lg rounded-lg'
						onMouseEnter={handleMenuContentMouseEnter}
						onMouseLeave={handleMenuContentMouseLeave}
						ref={menuContentRef}
					>
						<NavLink
							href='/projects/create/'
							className='block text-black px-4 py-2 hover:bg-gray-700'
						>
							Create New Project
						</NavLink>
						<NavLink
							href='/projects/map/'
							className='block text-black px-4 py-2 hover:bg-gray-700'
						>
							Map
						</NavLink>
					</div>
				)}
			</div>


            <NavLink isMobile={isMobile} onClick={handleLogout}>
				Logout
			</NavLink>
		</>
	);
    const guestLinks = (isMobile: boolean) => (
        <>
            <NavLink
                isSelected={isSelected('/auth/login')}
                isMobile={isMobile}
                href='/auth/login'
            >
                Login
            </NavLink>
            <NavLink
                isSelected={isSelected('/auth/register')}
                isMobile={isMobile}
                href='/auth/register'
            >
                Register
            </NavLink>
        </>
    );

    return (
        <Disclosure as='nav' className='bg-gray-800'>
            {({ open }) => (
                <>
                    <div className='mx-auto max-w-7xl px-2 sm:px-6 lg:px-8'>
                        <div className='relative flex h-16 items-center justify-between'>
                            <div className='absolute inset-y-0 left-0 flex items-center sm:hidden'>
                                <Disclosure.Button className='inline-flex items-center justify-center rounded-md p-2 text-gray-400 hover:bg-gray-700 hover:text-white focus:outline-none focus:ring-2 focus:ring-inset focus:ring-white'>
                                    <span className='sr-only'>
                                        Open main menu
                                    </span>
                                    {open ? (
                                        <XMarkIcon
                                            className='block h-6 w-6'
                                            aria-hidden='true'
                                        />
                                    ) : (
                                        <Bars3Icon
                                            className='block h-6 w-6'
                                            aria-hidden='true'
                                        />
                                    )}
                                </Disclosure.Button>
                            </div>
                            <div className='flex flex-1 items-center justify-center sm:items-stretch sm:justify-start'>
                                <div className='flex flex-shrink-0 items-center'>
                                    <NavLink href='/' isBanner>
                                        Full Auth
                                    </NavLink>
                                </div>
                                <div className='hidden sm:ml-6 sm:block'>
                                    <div className='flex space-x-4'>
                                        {isAuthenticated
                                            ? authLinks(false)
                                            : guestLinks(false)}
                                        
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <Disclosure.Panel className='sm:hidden'>
                        <div className='space-y-1 px-2 pb-3 pt-2'>
                            {isAuthenticated
                                ? authLinks(true)
                                : guestLinks(true)}
                        </div>
                    </Disclosure.Panel>
                </>
            )}
        </Disclosure>
    );
}
