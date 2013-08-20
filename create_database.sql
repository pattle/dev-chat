-- phpMyAdmin SQL Dump
-- version 3.5.1
-- http://www.phpmyadmin.net
--
-- Host: localhost
-- Generation Time: Aug 20, 2013 at 04:34 PM
-- Server version: 5.5.24-log
-- PHP Version: 5.4.3

SET SQL_MODE="NO_AUTO_VALUE_ON_ZERO";
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8 */;

--
-- Database: `devchat`
--

CREATE DATABASE devchat;

-- --------------------------------------------------------

--
-- Table structure for table `activity`
--

CREATE TABLE IF NOT EXISTS `activity` (
  `activity_id` int(11) NOT NULL AUTO_INCREMENT,
  `event` int(11) NOT NULL,
  `activity_time` int(11) NOT NULL,
  `username` varchar(255) NOT NULL,
  PRIMARY KEY (`activity_id`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1 AUTO_INCREMENT=1 ;

-- --------------------------------------------------------

--
-- Table structure for table `colours`
--

CREATE TABLE IF NOT EXISTS `colours` (
  `colour_id` int(11) NOT NULL AUTO_INCREMENT,
  `colour_name` varchar(50) NOT NULL,
  `hexcode` varchar(7) NOT NULL,
  `precedence` int(11) NOT NULL,
  `updated` int(11) NOT NULL,
  `updated_by` int(11) NOT NULL,
  `created` int(11) NOT NULL,
  `created_by` int(11) NOT NULL,
  PRIMARY KEY (`colour_id`)
) ENGINE=InnoDB  DEFAULT CHARSET=latin1 AUTO_INCREMENT=10 ;

--
-- Dumping data for table `colours`
--

INSERT INTO `colours` (`colour_id`, `colour_name`, `hexcode`, `precedence`, `updated`, `updated_by`, `created`, `created_by`) VALUES
(1, 'Charcoal', '#333333', 1, 1376908004, 1, 1376908004, 1),
(2, 'Red', '#c12c0f', 2, 1376908004, 1, 1376908004, 1),
(3, 'Blue', '#4b8cdc', 3, 1376908004, 1, 1376908004, 1),
(4, 'Green', '#42bc21', 4, 1376908004, 1, 1376908004, 1),
(5, 'Purple', '#bc2179', 5, 1376908004, 1, 1376908004, 1),
(6, 'Burnt Orange', '#bc6321', 6, 1376908004, 1, 1376908004, 1),
(7, 'Light Green', '#92bc21', 7, 1376908004, 1, 1376908004, 1),
(8, 'Aqua', '#21bc5b', 8, 1376908004, 1, 1376908004, 1),
(9, 'Grey', '#7c7c7c', 9, 1376908004, 1, 1376908004, 1);

-- --------------------------------------------------------

--
-- Table structure for table `events`
--

CREATE TABLE IF NOT EXISTS `events` (
  `event_id` int(11) NOT NULL AUTO_INCREMENT,
  `event_name` varchar(100) DEFAULT NULL,
  `event_description` text NOT NULL,
  `updated` int(11) NOT NULL,
  `updated_by` int(11) NOT NULL,
  `created` int(11) NOT NULL,
  `created_by` int(11) NOT NULL,
  PRIMARY KEY (`event_id`)
) ENGINE=InnoDB  DEFAULT CHARSET=latin1 AUTO_INCREMENT=8 ;

--
-- Dumping data for table `events`
--

INSERT INTO `events` (`event_id`, `event_name`, `event_description`, `updated`, `updated_by`, `created`, `created_by`) VALUES
(1, 'User connected', 'A new user has connected', 1376579841, 1, 1376579841, 1),
(2, 'User disconnect', 'A user has disconnected and left the chat', 1376579841, 1, 1376579841, 1),
(3, 'Invite sent', 'A user user has sent an invite to their room', 1376579841, 1, 1376579841, 1),
(4, 'Invite accepted', 'A user user has accepted an invite', 1376579841, 1, 1376579841, 1),
(5, 'Invite rejected', 'A user user has rejected an invite', 1376579841, 1, 1376579841, 1),
(6, 'Left room', 'A user has left a room', 1376579841, 1, 1376579841, 1),
(7, 'Joined room', 'A user has joined a room', 1376579841, 1, 1376579841, 1);

-- --------------------------------------------------------

--
-- Table structure for table `messages`
--

CREATE TABLE IF NOT EXISTS `messages` (
  `message_id` int(11) NOT NULL AUTO_INCREMENT,
  `message_text` text NOT NULL,
  `message_sent` varchar(100) NOT NULL,
  `message_from` varchar(255) NOT NULL,
  `room` varchar(255) NOT NULL,
  `message_type_id` int(11) NOT NULL,
  PRIMARY KEY (`message_id`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1 AUTO_INCREMENT=1 ;

-- --------------------------------------------------------

--
-- Table structure for table `message_types`
--

CREATE TABLE IF NOT EXISTS `message_types` (
  `message_type_id` int(11) NOT NULL AUTO_INCREMENT,
  `message_type_name` varchar(100) NOT NULL,
  `updated` int(11) NOT NULL,
  `updated_by` int(11) NOT NULL,
  `created` int(11) NOT NULL,
  `created_by` int(11) NOT NULL,
  PRIMARY KEY (`message_type_id`)
) ENGINE=InnoDB  DEFAULT CHARSET=latin1 AUTO_INCREMENT=3 ;

--
-- Dumping data for table `message_types`
--

INSERT INTO `message_types` (`message_type_id`, `message_type_name`, `updated`, `updated_by`, `created`, `created_by`) VALUES
(1, 'normal', 1376643981, 1, 1376643981, 1),
(2, 'code', 1376643981, 1, 1376643981, 1);

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
