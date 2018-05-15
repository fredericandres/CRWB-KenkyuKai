import React from 'react';
import {createBottomTabNavigator, createStackNavigator} from 'react-navigation';
import {HomeScreen} from "./Screens/Home";
import {ObservationDetailScreen} from "./Screens/ObservationDetail";
import {SearchExploreScreen} from "./Screens/SearchExplore";
import FontAwesome from 'react-native-vector-icons/FontAwesome';
import {NotificationsScreen} from "./Screens/Notifications";
import {ProfileScreen} from "./Screens/Profile";
import {EatingOutListScreen} from "./Screens/EatingOutList";
import {CreateObservationScreen} from "./Screens/CreateObservation";
import {brandContrast, brandLight, brandMain, iconSizeStandard} from './constants/Constants';
import {StyleSheet} from "react-native";
import {SettingsScreen} from "./Screens/Settings";
import {SignUpLogInScreen} from "./Screens/SignUpLogIn";
import strings from "./strings";

const styles = StyleSheet.create({
    navHeaderStyle: {
        backgroundColor: brandMain
    },
    navHeaderTitleStyle: {
        fontWeight: 'bold',
    },
});

const HomeStack = createStackNavigator({
        Home: { screen: HomeScreen },
        Profile: { screen: ProfileScreen },
        ObservationDetail: { screen: ObservationDetailScreen },
    },
    {
        initialRouteName: 'Home',
        navigationOptions: {
            headerStyle: styles.navHeaderStyle,
            headerTintColor: brandContrast,
            headerTitleStyle: styles.navHeaderTitleStyle,
        }
    }
);

const ExploreSearchStack = createStackNavigator({
        Explore: { screen: SearchExploreScreen },
        ObservationDetail: { screen: ObservationDetailScreen },
        Profile: { screen: ProfileScreen },
    },
    {
        initialRouteName: 'Explore',
        navigationOptions: {
            headerStyle: styles.navHeaderStyle,
            headerTintColor: brandContrast,
            headerTitleStyle: styles.navHeaderTitleStyle,
        }
    }
);

const NotificationsStack = createStackNavigator({
        Notifications: { screen: NotificationsScreen },
        ObservationDetail: { screen: ObservationDetailScreen },
        Profile: { screen: ProfileScreen },
    },
    {
        initialRouteName: 'Notifications',
        navigationOptions: {
            headerStyle: styles.navHeaderStyle,
            headerTintColor: brandContrast,
            headerTitleStyle: styles.navHeaderTitleStyle,
        }
    }
);

const EatingOutListStack = createStackNavigator({
        EatingOutList: { screen: EatingOutListScreen },
        ObservationDetail: { screen: ObservationDetailScreen },
        Profile: { screen: ProfileScreen },
    },
    {
        initialRouteName: 'EatingOutList',
        navigationOptions: {
            headerStyle: styles.navHeaderStyle,
            headerTintColor: brandContrast,
            headerTitleStyle: styles.navHeaderTitleStyle,
        }
    }
);

const ProfileStack = createStackNavigator({
        Profile: { screen: ProfileScreen },
        Settings: { screen: SettingsScreen },
        SignUpLogIn: { screen: SignUpLogInScreen },
        ObservationDetail: { screen: ObservationDetailScreen },
    },
    {
        initialRouteName: 'Profile',
        navigationOptions: {
            headerStyle: styles.navHeaderStyle,
            headerTintColor: brandContrast,
            headerTitleStyle: styles.navHeaderTitleStyle,
        }
    }
);

const CreateObservationStack = createStackNavigator({
        CreateObservation: { screen: CreateObservationScreen },
    },
    {
        initialRouteName: 'CreateObservation',
        navigationOptions: {
            headerStyle: styles.navHeaderStyle,
            headerTintColor: brandContrast,
            headerTitleStyle: styles.navHeaderTitleStyle,
        }
    }
);

const TabBar = createBottomTabNavigator(
    {
        Home: { screen: HomeStack, navigationOptions: {title: strings.home} },
        Explore: { screen: ExploreSearchStack, navigationOptions: {title: strings.explore} },
        Notifications: { screen: NotificationsStack, navigationOptions: {title: strings.notifications} },
        EatingOutList: { screen: EatingOutListStack, navigationOptions: {title: strings.eatingOutList} },
    },
    {
        navigationOptions: ({ navigation }) => ({
            tabBarIcon: ({ focused, tintColor }) => {
                const { routeName } = navigation.state;
                let iconName;
                if (routeName === 'Home') {
                    iconName = `home`;
                } else if (routeName === 'Explore') {
                    iconName = `search`;
                } else if (routeName === 'Notifications') {
                    iconName = `heart`;
                } else if (routeName === 'EatingOutList') {
                    iconName = `cutlery`;
                }
                return <FontAwesome name={iconName} size={iconSizeStandard} color={tintColor} />;
            },
        }),
        tabBarOptions: {
            activeTintColor: brandMain,
            inactiveTintColor: brandLight,
            style: {
                backgroundColor: brandContrast,
            },
        },
        animationEnabled: true,
        swipeEnabled: true,
    }
);

export default RootStack = createStackNavigator(
    {
        Main: {
            screen: TabBar,
        },
        CreateObservation: {
            screen: CreateObservationStack,
        },
        MyProfile: {
            screen: ProfileStack,
        },
        SignUpLogIn: {
            screen: SignUpLogInScreen,
        }
    },
    {
        mode: 'modal',
        headerMode: 'none',
    }
);