/* eslint-disable eol-last */
/* eslint-disable no-console */
/* eslint-disable quotes */
/* eslint-disable object-curly-spacing */
/* eslint-disable react/jsx-wrap-multilines */
/* eslint-disable jsx-quotes */
/* eslint-disable react/jsx-curly-spacing */
/* eslint-disable semi */


import {  FiSearch } from 'react-icons/fi'
import classes from './styles.module.css'
import {  InputAdornment, OutlinedInput } from '@mui/material'


const RecentChats = () => {
    return (
      <>
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
                      <div className={classes.onlineMember}>
                          <div className={classes.userImageContainer}>
                              <img src="https://picsum.photos/200/200?grayscale" className={classes.userImage} alt="" />
                              <div className={classes.userStatus}></div>
                          </div>
                          <div className={classes.blurry}></div>
                          <span>
                              Patrick
                          </span>
                      </div>
                      <div className={classes.onlineMember}>
                          <div className={classes.userImageContainer}>
                              <img src="https://picsum.photos/200/200?grayscale" className={classes.userImage} alt="" />
                              <div className={classes.userStatus}></div>
                          </div>
                          <div className={classes.blurry}></div>
                          <span>
                              Doris
                          </span>
                      </div>
                      <div className={classes.onlineMember}>
                          <div className={classes.userImageContainer}>
                              <img src="https://picsum.photos/200/200?grayscale" className={classes.userImage} alt="" />
                              <div className={classes.userStatus}></div>
                          </div>
                          <div className={classes.blurry}></div>
                          <span>
                              Emily
                          </span>
                      </div>
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
                  </div>
              </div>
              <div className={classes.recentChats}>
                  <span className={classes.recentsTitle}>Recent</span>
                  <div className={classes.recentChatsContainer}>
                      <div className={classes.recentChat}>
                          <div className={classes.userImageContainer}>
                              <img src="https://picsum.photos/200/200?grayscale" className={classes.userImage} alt="" />
                              <div className={classes.userStatus}></div>
                          </div>
                          <div>
                              <span>Doris Brown</span>
                              <span>yeah, I remember the work i was...</span>
                          </div>
                          <span>10:05 PM</span>
                      </div>
                      <div className={`${classes.recentChat}`}>
                          <div className={classes.userImageContainer}>
                              <img src="https://picsum.photos/200/200?grayscale" className={classes.userImage} alt="" />
                              <div className={classes.userStatus}></div>
                          </div>
                          <div>
                              <span>Doris Brown</span>
                              <span>typing...</span>
                          </div>
                          <span>10:05 PM</span>
                      </div>
                      <div className={classes.recentChat}>
                          <div className={classes.userImageContainer}>
                              <img src="https://picsum.photos/200/200?grayscale" className={classes.userImage} alt="" />
                              <div className={classes.userStatus}></div>
                          </div>
                          <div>
                              <span>Doris Brown</span>
                              <span>typing...</span>
                          </div>
                          <span>10:05 PM</span>
                      </div>
                      <div className={classes.recentChat}>
                          <div className={classes.userImageContainer}>
                              <img src="https://picsum.photos/200/200?grayscale" className={classes.userImage} alt="" />
                              <div className={classes.userStatus}></div>
                          </div>
                          <div>
                              <span>Doris Brown</span>
                              <span>typing...</span>
                          </div>
                          <span>10:05 PM</span>
                      </div>
                      <div className={classes.recentChat}>
                          <div className={classes.userImageContainer}>
                              <img src="https://picsum.photos/200/200?grayscale" className={classes.userImage} alt="" />
                              <div className={classes.userStatus}></div>
                          </div>
                          <div>
                              <span>Doris Brown</span>
                              <span>typing...</span>
                          </div>
                          <span>10:05 PM</span>
                      </div>
  
                      <div className={classes.recentChat}>
                          <div className={classes.userImageContainer}>
                              <img src="https://picsum.photos/200/200?grayscale" className={classes.userImage} alt="" />
                              <div className={classes.userStatus}></div>
                          </div>
                          <div>
                              <span>Doris Brown</span>
                              <span>typing...</span>
                          </div>
                          <span>10:05 PM</span>
                      </div>
                      <div className={classes.recentChat}>
                          <div className={classes.userImageContainer}>
                              <img src="https://picsum.photos/200/200?grayscale" className={classes.userImage} alt="" />
                              <div className={classes.userStatus}></div>
                          </div>
                          <div>
                              <span>Doris Brown</span>
                              <span>typing...</span>
                          </div>
                          <span>10:05 PM</span>
                      </div>
                      <div className={classes.recentChat}>
                          <div className={classes.userImageContainer}>
                              <img src="https://picsum.photos/200/200?grayscale" className={classes.userImage} alt="" />
                              <div className={classes.userStatus}></div>
                          </div>
                          <div>
                              <span>Doris Brown</span>
                              <span>typing...</span>
                          </div>
                          <span>10:05 PM</span>
                      </div>
                      <div className={classes.recentChat}>
                          <div className={classes.userImageContainer}>
                              <img src="https://picsum.photos/200/200?grayscale" className={classes.userImage} alt="" />
                              <div className={classes.userStatus}></div>
                          </div>
                          <div>
                              <span>Doris Brown</span>
                              <span>typing...</span>
                          </div>
                          <span>10:05 PM</span>
                      </div>
                      <div className={classes.recentChat}>
                          <div className={classes.userImageContainer}>
                              <img src="https://picsum.photos/200/200?grayscale" className={classes.userImage} alt="" />
                              <div className={classes.userStatus}></div>
                          </div>
                          <div>
                              <span>Doris Brown</span>
                              <span>typing...</span>
                          </div>
                          <span>10:05 PM</span>
                      </div>
                  </div>
              </div>
      </>
    )
  }
  
  export default RecentChats;