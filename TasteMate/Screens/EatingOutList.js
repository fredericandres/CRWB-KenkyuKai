import React from 'react';
import {FlatList, TouchableOpacity, View, Platform} from 'react-native';
import {NavBarCreateObsButton, NavBarProfileButton} from "../Components/NavBarButton";
import strings from "../strings";
import {EatingOutListComponent} from "../Components/EatingOutListComponent";
import MapView from 'react-native-maps';
import Permissions from "react-native-permissions";
import firebase from 'react-native-firebase';
import {
    _navigateToScreen,
    _sortArrayByTimestamp,
    brandAccent,
    brandBackground,
    iconSizeStandard,
    pathActions,
    pathObservations
} from "../constants/Constants";
import {LogInMessage} from "../Components/LogInMessage";
import {MapMarkerComponent} from "../Components/MapMarkerComponent";
import {EmptyComponent} from "../Components/EmptyComponent";
import FontAwesome from "react-native-vector-icons/FontAwesome";

export const NO_LOCATION = 'noLocation';
export const FURTHER_AWAY = 'furtherAway';
const ScreensEnum = Object.freeze({LIST:1, MAP:2});
const initialState = {
    selectedIndex: ScreensEnum.MAP,
    observationsList: [],
    observations: [],
    user: null,
    userlocation: null,
    isRefreshing: false,
    emptyListMessage: strings.loading
};

export class EatingOutListScreen extends React.Component {
    static navigationOptions = ({navigation})=> {
        const {params = {}} = navigation.state;
        return {
            title: strings.eatingOutList + ' ',
            headerLeft: (
                <NavBarProfileButton nav={navigation} action={() => params.onProfilePressed()}/>
            ),
            headerRight: (
                <NavBarCreateObsButton nav={navigation} action={() => params.onCreateObsPressed()}/>
            ),
        }
    };

    constructor() {
        super();

        this.unsubscriber = null;
        this.state = initialState;
        this._onPressList = this._onPressList.bind(this);
        this._onPressMap = this._onPressMap.bind(this);
        this._getEatingOutObservations = this._getEatingOutObservations.bind(this);
        this._getDistanceFromLatLonInKm = this._getDistanceFromLatLonInKm.bind(this);
        this._onNavBarButtonPressed = this._onNavBarButtonPressed.bind(this);
    }

    componentDidMount() {
        this.props.navigation.setParams({
            onProfilePressed: (() => this._onNavBarButtonPressed(true)),
            onCreateObsPressed: this._onNavBarButtonPressed,
        });
        this.unsubscriber = firebase.auth().onAuthStateChanged((user) => {
            // Reset page info
            let resetState = initialState;
            resetState.user = user;
            this.setState(resetState, () => {
                if (!user) {
                    // Do nothing
                } else {
                    if (Platform.OS === 'android' && Platform.Version < 23) {
                        // Do not check permission pre-Marshmallow
                        this._getEatingOutObservations();
                    } else {
                        Permissions.request('location').then(response => {
                            this.setState({locationPermission: response});
                            if (response === 'authorized') {
                                navigator.geolocation.getCurrentPosition((position) => {
                                    this.setState({ userlocation: position.coords}, () => this._getEatingOutObservations());
                                });
                            } else {
                                this._getEatingOutObservations();
                            }
                        }).catch((error) => {
                            console.log('Error while requesting location permission');
                            console.log(error);
                            this._getEatingOutObservations();
                        });
                    }
                }
            });
        });
    }

    _onNavBarButtonPressed(isProfile) {
        if (this.state.user && !this.state.user.isAnonymous) {
            if (isProfile) {
                let params = {};
                params.myProfile = true;
                _navigateToScreen('MyProfile', this.props.navigation, params);
            } else {
                _navigateToScreen('CreateObservation', this.props.navigation);
            }
        } else {
            _navigateToScreen('SignUpLogIn', this.props.navigation);
        }
    }

    _getEatingOutObservations() {
        const _getDistanceFromLatLonInKm = this._getDistanceFromLatLonInKm;
        const curState = this.state;

        console.log('Loading observations ids saved as Eating Out...');
        const refEatingOut = firebase.database().ref(pathActions).orderByKey().equalTo(this.state.user.uid);
        refEatingOut.once('value')
            .then((dataSnapshot) => {
                console.log('Observations ids saved as Eating Out successfully retrieved');
                let observations = [];
                let asyncWorkers = [];
                dataSnapshot.forEach(function (userIdSnapshot) {
                    const userid = userIdSnapshot.key;
                    userIdSnapshot.forEach(function (obsIdSnapshot) {
                        const obsid = obsIdSnapshot.key;
                        if (obsIdSnapshot.toJSON().cutleries) {
                            const promise = new Promise(function (resolve, reject) {
                                firebase.database().ref(pathObservations).child(userid).child(obsid).once('value')
                                    .then((dataSnapshot) => {
                                        console.log('Eating Out observation successfully retrieved');
                                        let observation = dataSnapshot.toJSON();
                                        if (curState.locationPermission && curState.userlocation) {
                                            observation.distance = _getDistanceFromLatLonInKm(observation);
                                        }
                                        observations.push(observation);
                                        resolve();
                                    }).catch((error) => {
                                        console.log('Error while retrieving Eating Out observation');
                                        console.log(error);
                                        reject(error);
                                    }
                                );
                            });
                            asyncWorkers.push(promise);
                        }
                    });
                });

                Promise.all(asyncWorkers).then(() => {
                    let observationsList = [];

                    if (curState.userlocation) {
                        observations.sort(function(a,b) {
                            if (a.distance < b.distance)
                                return -1;
                            if (a.distance > b.distance)
                                return 1;
                            return 0;
                        });

                        // Put observations in different arrays according to how far away from user they are
                        const distances = [1, 2, 5, 10];
                        let currentObs = [];
                        let distanceCount = 0;

                        for (let i = 0; i < observations.length; i++) {
                            let observation = observations[i];
                            if (observation.distance <= distances[distanceCount]) {
                                currentObs.push(observation);
                            } else {
                                observationsList.push({distance: distances[distanceCount], observations:currentObs});
                                currentObs = [];
                                distanceCount++;

                                if (distanceCount === distances.length) {
                                    currentObs = observations.slice(i, observations.length);
                                    observationsList.push({distance: FURTHER_AWAY, observations:currentObs});
                                    break;
                                } else {
                                    i--;
                                }
                            }
                        }
                    } else {
                        _sortArrayByTimestamp(observations);
                        observationsList.push({distance: NO_LOCATION, observations:observations});
                    }

                    this.setState({
                        observations: observations,
                        observationsList: observationsList,
                        emptyListMessage: strings.noEatingOutList
                    });
                }).catch(
                    (error) => {
                        console.log('Error while retrieving observations in Eating Out');
                        console.log(error);
                    }
                );
            }).catch((error) => {
                console.log('Error while retrieving observations ids saved as Eating Out');
                console.log(error);
            }
        );
    }

    _getDistanceFromLatLonInKm(observation) {
        if(observation.location) {
            const lat1 = observation.location.latitude;
            const lon1 = observation.location.longitude;
            const lat2 = this.state.userlocation.latitude;
            const lon2 = this.state.userlocation.longitude;
            const R = 6371;
            let dLat = EatingOutListScreen._deg2rad(lat2 - lat1);
            let dLon = EatingOutListScreen._deg2rad(lon2 - lon1);
            let a =
                Math.sin(dLat / 2) * Math.sin(dLat / 2) +
                Math.cos(EatingOutListScreen._deg2rad(lat1)) *
                Math.cos(EatingOutListScreen._deg2rad(lat2)) *
                Math.sin(dLon / 2) * Math.sin(dLon / 2)
            ;
            const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
            const d = R * c;
            return d;
        } else {
            return 100000000;
        }
    }

    static _deg2rad(deg) {
        return deg * (Math.PI/180)
    }

    componentWillUnmount() {
        if (this.unsubscriber) {
            this.unsubscriber();
        }
    }

    _onPressList() {
        this.setState({selectedIndex: ScreensEnum.LIST});
    }

    _onPressMap() {
        this.setState({selectedIndex: ScreensEnum.MAP});
    }

    _keyExtractor = (item, index) => item.distance.toString();

    render() {
        let location = this.state.userlocation;
        if (!location && this.state.observations) {
            for (let i = 0; i < this.state.observations.length; i++) {
                const obs = this.state.observations[i];
                if (obs.location) {
                    location = obs.location;
                    break;
                }
            }
        }

        return (
            <View style={{flex:1}}>
                {
                    this.state.user && !this.state.user.isAnonymous &&
                    <View style={{ flex: 1 }}>
                        {(!this.state.observations || this.state.observations.length === 0) && <EmptyComponent message={this.state.emptyListMessage}/>}
                        {
                            (this.state.observations &&  this.state.observations.length > 0) &&
                            <View style={{ flex: 1 }}>
                                {
                                    (this.state.selectedIndex === ScreensEnum.LIST || !location) &&
                                    <FlatList
                                        data={this.state.observationsList}
                                        renderItem={({item}) => item.observations.length > 0 ? <EatingOutListComponent observationsList={item} {...this.props}/> : <View style={{backgroundColor: 'red'}}/>}
                                        keyExtractor={this._keyExtractor}
                                        removeClippedSubviews={true}
                                        onRefresh={this._getEatingOutObservations}
                                        refreshing={this.state.isRefreshing}
                                    />
                                }
                                {
                                    this.state.selectedIndex === ScreensEnum.MAP && location &&
                                    <MapView
                                        style={{flex: 1}}
                                        initialRegion={{
                                            latitude: location.latitude,
                                            longitude: location.longitude,
                                            latitudeDelta: 1,
                                            longitudeDelta: 1,
                                        }}
                                        showsCompass={true}
                                        showsScale={true}
                                        showsUserLocation={true}
                                        showsMyLocationButton={true}
                                        showsIndoors={false}
                                        showsBuildings={false}
                                        showsTraffic={false}
                                        userLocationAnnotationTitle={''}
                                    >
                                        {this.state.observations && this.state.observations.map(obs => (
                                            obs.location ? <MapMarkerComponent observation={obs} key={obs.observationid}/> : <View key={obs.observationid}/>
                                        ))}
                                    </MapView>
                                }
                            </View>
                        }
                        <TouchableOpacity name={'actionbutton'} onPress={this.state.selectedIndex === ScreensEnum.MAP ? this._onPressList : this._onPressMap} style={{width: 60, height: 60, borderRadius: 30, backgroundColor: brandAccent, position: 'absolute', bottom: 10, right: 10, alignItems:'center', justifyContent:'center'}}>
                            <FontAwesome name={this.state.selectedIndex === ScreensEnum.MAP ? 'list' : 'map'}  size={iconSizeStandard} color={brandBackground} />
                        </TouchableOpacity>
                    </View>
                }
                {
                    !this.state.user || this.state.user.isAnonymous &&
                    <LogInMessage style={{flex:1}}/>
                }
            </View>
        );
    }
}
