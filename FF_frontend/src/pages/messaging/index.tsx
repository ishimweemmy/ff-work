/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable react/jsx-key */
/* eslint-disable no-console */
/* eslint-disable quotes */
/* eslint-disable object-curly-spacing */
/* eslint-disable react/jsx-wrap-multilines */
/* eslint-disable jsx-quotes */
/* eslint-disable react/jsx-curly-spacing */
/* eslint-disable semi */
import { BsFillChatSquareDotsFill, BsPersonCircle, BsPeople, BsEmojiSmile } from 'react-icons/bs'
import { RiAttachment2, RiContactsFill, RiSendPlane2Fill } from 'react-icons/ri'
import { FiMoreHorizontal, FiMoreVertical, FiSearch, FiSettings } from 'react-icons/fi'
import classes from './styles.module.css';
import Image from 'next/image';
import logoIcon from '@/icons/branding/fish.svg';
import { MdLanguage, MdOutlineLightMode } from 'react-icons/md'
import { Accordion, AccordionDetails, AccordionSummary, InputAdornment, OutlinedInput } from '@mui/material'
import { BiSolidImage, BiSolidPhoneCall } from 'react-icons/bi'
import { AiFillVideoCamera, AiOutlineClockCircle } from 'react-icons/ai'
import { useEffect, useState } from 'react'
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import { RxCrossCircled } from 'react-icons/rx'
import { Swiper, SwiperSlide } from 'swiper/react';
import { A11y, Navigation } from 'swiper';
import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/pagination';
import 'swiper/css/scrollbar';
import { truncateText } from '@/helpers/truncatetext';
import io from 'socket.io-client'

const socket = io('http://localhost:8000')

const Index = () => {
  const [expanded, setExpanded] = useState<string | false>(false);

  const handleChange = (panel: string) => (event: React.SyntheticEvent, isExpanded: boolean) => setExpanded(isExpanded ? panel : false);
  const [rightSideOpen, setRightSideOpen] = useState(false);

  const [menuIcons, setMenuIcons] = useState([
    {
        icon: <BsPersonCircle className={classes.icon} />,
        label: 'profile',
        isActive: false
    },
    {
        icon: <BsFillChatSquareDotsFill className={classes.icon} />,
        label: 'chats',
        isActive: true
    },
    {
        icon: <BsPeople className={classes.icon} />,
        label: 'groups',
        isActive: false
    },
    {
        icon: <RiContactsFill className={classes.icon} />,
        label: 'contacts',
        isActive: false
    },
    {
        icon: <FiSettings className={classes.icon} />,
        label: 'settings',
        isActive: false
    },
    {
        icon: <MdLanguage className={classes.icon} />,
        label: 'language',
        isActive: false
    },
    {
        icon: <MdOutlineLightMode className={classes.icon} />,
        label: 'theme',
        isActive: false
    },
    {
        icon: <img src="https://picsum.photos/300/200?grayscale" className={classes.userImage} alt="" />,
        label: 'logout',
        isActive: false
    }
  ]);

  const handleMenuIconClick = (label: string) => {
    return setMenuIcons(prevMenuIcons => {
        return prevMenuIcons.map((icon, index) => {
            return icon.label === label ? {...icon, isActive: true} : {...icon, isActive: false} 
        })
    })
  }

  const [onlineMembers, setOnlineMembers] = useState([
    {
        imgSrc: 'https://picsum.photos/300/200?grayscale',
        username: 'ishimwe',
        userId: 1
    },
    {
        imgSrc: 'https://picsum.photos/300/200?grayscale',
        username: 'ishimwe',
        userId: 2
    },
    {
        imgSrc: 'https://picsum.photos/300/200?grayscale',
        username: 'ishimwe',
        userId: 3
    },
    {
        imgSrc: 'https://picsum.photos/300/200?grayscale',
        username: 'ishimwe',
        userId: 4
    },
    {
        imgSrc: 'https://picsum.photos/300/200?grayscale',
        username: 'ishimwe',
        userId: 5
    },
  ])

  const [recentMessages, setRecentMessages] = useState([
    {
        senderName: 'ishimwe emmy',
        senderImgSrc: 'https://picsum.photos/200/200',
        senderMessage: 'yeah, I was waiting for her...',
        sendTime: '10:05 PM',
        active: true,
        typing: false
    },
    {
        senderName: 'gloria gogo',
        senderImgSrc: 'https://picsum.photos/200/200',
        senderMessage: 'OMG, seriously? I didnt know it had happened...',
        sendTime: '10:05 PM',
        active: false,
        typing: false
    },
    {
        senderName: 'axelle',
        senderImgSrc: 'https://picsum.photos/200/200',
        senderMessage: 'It is true though, I knew it from the start...',
        sendTime: '10:05 PM',
        active: true,
        typing: true
    },
    {
        senderName: 'gloria gogo',
        senderImgSrc: 'https://picsum.photos/200/200',
        senderMessage: 'OMG, seriously? I didnt know it had happened...',
        sendTime: '10:05 PM',
        active: false,
        typing: false
    },
    {
        senderName: 'ishimwe emmy',
        senderImgSrc: 'https://picsum.photos/200/200',
        senderMessage: 'yeah, I was waiting for her...',
        sendTime: '10:05 PM',
        active: true,
        typing: false
    },
    {
        senderName: 'axelle',
        senderImgSrc: 'https://picsum.photos/200/200',
        senderMessage: 'It is true though, I knew it from the start...',
        sendTime: '10:05 PM',
        active: true,
        typing: true
    },
  ])

  const [chatMessages, setChatMessages] = useState([
    {
        currentUser: true,
        message: 'Good morning',
        timeSent: '10:00 AM',
        senderName: 'ishimwe-emma',
        senderImgSrc: 'https://picsum.photos/700/200',
        id: 1
    },
    {
        currentUser: true,
        message: 'Good morning',
        timeSent: '10:00 AM',
        senderName: 'ishimwe-emma',
        senderImgSrc: 'https://picsum.photos/700/200',
        id: 2
    },
    {
        currentUser: false,
        message: 'Hi, how was the trip you had last saturday?',
        timeSent: '10:00 AM',
        senderName: 'elyse',
        senderImgSrc: 'https://picsum.photos/600/200',
        id: 3
    },
    {
        currentUser: true,
        message: "Hello how's it going there? The trip was cool and we had so much fun.. I wish you were there.",
        timeSent: '10:00 AM',
        senderName: 'ishimwe-emma',
        senderImgSrc: 'https://picsum.photos/700/200',
        id: 4
    },
    {
        currentUser: false,
        message: 'xlm gee, ko ubuzeho ra',
        timeSent: '10:00 AM',
        senderName: 'elyse',
        senderImgSrc: 'https://picsum.photos/600/200',
        id: 5
    },
    {
        currentUser: true,
        message: 'ngo bimez bite c shumi yange',
        timeSent: '10:00 AM',
        senderName: 'ishimwe-emma',
        senderImgSrc: 'https://picsum.photos/600/200',
        id: 6
    }
  ])

  return (
    <div className={classes.chatContainer}>
        <div className={classes.menuSide}>
            <Image
                src={ logoIcon }
                className={ classes.logoImg }
                width={ 30 }
                height={ 30 }
                alt="logo"
            />
            <div className={classes.menuItems}>
                {menuIcons.slice(0, 5).map((menuIcon, index) => (
                    <div className={menuIcon.isActive ? classes.menuLinkActive : classes.menuLink} key={index} onClick={() => handleMenuIconClick(menuIcon.label)}>
                        {menuIcon.icon}
                    </div>
                ))}
            </div>
            <div className={classes.bottomMenuIcons}>
                {menuIcons.slice(5).map((menuIcon, index) => (
                    <div className={menuIcon.isActive ? classes.menuLinkActive : classes.menuLink} key={index} onClick={() => handleMenuIconClick(menuIcon.label)}>
                        {menuIcon.icon}
                    </div>
                ))}
            </div>
        </div>
        <div className={classes.leftSide}>
            <div className={classes.leftTopContainer}>
                <span className={classes.chatTitle}>Chats</span>
                <OutlinedInput
                    placeholder="Search messages or users"
                    className={classes.outlinedInput}
                    startAdornment={
                        <InputAdornment position="end">
                            <FiSearch style={{marginRight: '1rem'}} color='white'  />
                        </InputAdornment>
                    }
                    sx={{color: "#a6b0cf"}}
                />
                <div className={classes.onlineMembers}>
                    <Swiper
                        modules={[A11y, Navigation]}
                        spaceBetween={2}
                        slidesPerView={4}
                        onSwiper={(swiper) => console.log(swiper)}
                        onSlideChange={() => console.log('slide change')}
                        style={{width: '100%', height: '100%'}}
                    >
                        {onlineMembers.map(member => (
                            <SwiperSlide style={{width: '100%', height:'100%'}}>
                                <div className={classes.onlineMember}>
                                    <div className={classes.userImageContainer}>
                                        <img src="https://picsum.photos/200/200?grayscale" className={classes.userImage} alt="" />
                                        <div className={classes.userStatus}></div>
                                    </div>
                                    <div className={classes.blurry}></div>
                                    <span>
                                        Steve
                                    </span>
                                </div>
                            </SwiperSlide>
                        ))}
                    </Swiper>
                </div>
            </div>
            <div className={classes.recentChats}>
                <span className={classes.recentsTitle}>Recent</span>
                <div className={classes.recentChatsContainer}>
                    {recentMessages.map(message => (
                        <div className={classes.recentChat}>
                            <div className={classes.userImageContainer}>
                                <img src={message.senderImgSrc} className={classes.userImage} alt="" />
                                <div className={`${classes.userStatus} ${!message.active ? classes.userStatusOffline : ''}`}></div>
                            </div>
                            <div>
                                <span>{message.senderName}</span>
                                <span className={message.typing ? classes.userTyping : classes.userNotTyping}>{message.typing ? 'typing...' : truncateText(message.senderMessage)}</span>
                            </div>
                            <span>{message.sendTime}</span>
                        </div>
                    ))}
                </div>
            </div>
        </div>
        <div className={classes.chatSide}>
            <div className={`${classes.chat} ${rightSideOpen ? '' : classes.chat_w_r_open}`}>
                <div className={classes.chatNav}>
                    <div className={classes.leftChatNav} onClick={() => setRightSideOpen(true)}>
                        <img src="https://picsum.photos/300/200?grayscale" className={classes.userImage} alt="" />
                        <span>Albert Rodarte</span>
                        <div className={classes.userStatus}></div>
                    </div>
                    <div className={classes.rightChatNav}>
                        <FiSearch className={classes.chatIcon} />
                        <BiSolidPhoneCall className={classes.chatIcon} />
                        <AiFillVideoCamera className={classes.chatIcon} />
                        <BsPersonCircle className={classes.chatIcon} />
                        <FiMoreHorizontal className={classes.chatIcon} />
                    </div>
                </div>
                <div className={classes.chatMessages}>
                    {chatMessages.map(message => (
                        !message.currentUser ?
                         <div className={classes.outerReceivedContainer}>
                            <div className={classes.innerContainer}>
                                <img src={message.senderImgSrc} className={classes.userImage} alt="" />
                                <div className={classes.messageInfoCont}>
                                    <div className={classes.message}>
                                        <span className={classes.actualMessage}>{message.message}</span>
                                        <span className={classes.sendingTime}><AiOutlineClockCircle />{message.timeSent}</span>
                                    </div>
                                    <span className={classes.chatterUsername}>{message.senderName}</span>
                                </div>
                                <FiMoreVertical className={classes.messageIcon} />
                            </div>
                        </div> :
                        <div className={classes.outerSentContainer}>
                            <div className={classes.innerContainer}>
                                <FiMoreVertical className={classes.messageIcon} />
                                <div className={classes.messageInfoCont}>
                                    <div className={classes.message}>
                                        <span className={classes.actualMessage}>{message.message}</span>
                                        <span className={classes.sendingTime}><AiOutlineClockCircle />{message.timeSent}</span>
                                    </div>
                                    <span className={classes.chatterUsername}>{message.senderName}</span>
                                </div>
                                <img src={message.senderImgSrc} className={classes.userImage} alt="" />
                            </div>
                        </div>
                    ))}
                </div>
                <div className={classes.chatActions}>
                    <input type="text" className={classes.sendMessage} placeholder='Enter Message...'  />
                    <BsEmojiSmile className={classes.actionIcon} />
                    <RiAttachment2 className={classes.actionIcon} />
                    <BiSolidImage className={classes.actionIcon} />
                    <button className={classes.finalSend}>
                        <RiSendPlane2Fill />
                    </button>
                </div>
            </div>
            <div className={`${classes.rightSideOpen} ${rightSideOpen ? '' : classes.rightSideHidden}`}>
                <div className={classes.innerProfileContainer}>
                    <RxCrossCircled color='#abb4d2' className={classes.crossIcon} onClick={() => setRightSideOpen(false)}  />
                    <img src="https://picsum.photos/300/200?grayscale" className={classes.userImage} alt="" />
                    <div className={classes.mostInnerOne}>
                        <span>Albert Rodarte</span>
                        <div className={classes.profileDetails}>
                            <div className={classes.userStatus}></div>
                            <span>Active</span>
                        </div>
                    </div>
                </div>
                <span className={classes.profileStatus}>"If several languages coalesce, the grammar of the resulting language is more simple and regular than that of the individual."</span>
                <div className={classes.profileDesc}>
                    <Accordion
                        expanded={expanded === 'panel1'} onChange={handleChange('panel1')}
                        className={classes.accordion}
                    >
                        <AccordionSummary
                            aria-controls="panel1a-content"
                            expandIcon={<ExpandMoreIcon sx={{color: 'white', padding: 0}} />}
                            className={classes.accordionSummary}
                        >
                            <BsPersonCircle className={classes.icon} style={{padding: '.1rem'}} />
                            <span style={{marginLeft: "1rem"}}>About</span>
                        </AccordionSummary>
                        <AccordionDetails className={classes.accordionDetails}>
                            <div>
                                <span>Name</span>
                                <span>Patrick Hendricks</span>
                            </div>
                            <div>
                                <span>Email</span>
                                <span>patrickhendricks@gmail.com</span>
                            </div>
                            <div>
                                <span>Time</span>
                                <span>11:40 AM</span>
                            </div>
                            <div>
                                <span>Location</span>
                                <span>California, USA</span>
                            </div>
                        </AccordionDetails>
                    </Accordion>
                    <Accordion
                        expanded={expanded === 'panel2'} onChange={handleChange('panel2')}
                        className={classes.accordion}
                    >
                        <AccordionSummary
                            aria-controls="panel2a-content"
                            expandIcon={<ExpandMoreIcon sx={{color: 'white'}} />}
                            className={classes.accordionSummary}
                        >
                            <RiAttachment2 className={classes.icon} style={{padding: '.1rem'}} />
                            <span style={{marginLeft: "1rem"}}> Attached Files </span>
                        </AccordionSummary>
                        <AccordionDetails>
                            
                        </AccordionDetails>
                    </Accordion>
                </div>
            </div>
        </div>
    </div>
  )
}

export default Index;

