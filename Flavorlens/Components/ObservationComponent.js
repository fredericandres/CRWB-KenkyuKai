import React from 'react';
import {ActionSheetIOS, Alert, FlatList, Image, Platform, ScrollView, Text, TouchableOpacity, View} from 'react-native';
import FontAwesome from 'react-native-vector-icons/FontAwesome';
import {
    ActivityEnum,
    colorAccent,
    colorBackground,
    colorContrast,
    colorLight,
    colorMain,
    colorStandardBackground,
    EmojiEnum,
    formatNumberWithString,
    iconCutlery,
    iconEatingOut,
    iconLike,
    iconMenu,
    iconShare,
    iconSizeSmall,
    iconSizeStandard,
    navigateToScreen
} from '../Constants/Constants';
import styles, {smileySuperLargeFontSize} from '../styles';
import TimeAgo from 'react-native-timeago';
import {CommentComponent} from './CommentComponent';
import strings, {appName} from '../strings';
import Share from 'react-native-share';
import {currentUser} from '../App';
import {WriteCommentComponent} from './WriteCommentComponent';
import {CachedImage} from 'react-native-cached-image';
import {UserImageThumbnailComponent} from './UserImageThumbnailComponent';
import {allVocabulary} from '../Constants/Vocabulary';
import {allCurrencies} from '../Constants/Currencies';
import {allDietaryRestrictions} from '../Constants/DietaryRestrictions';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import LinearGradient from 'react-native-linear-gradient';
import ReadMore from './ReadMore';
import {
    addUserAction,
    getUser,
    getUserActions,
    getXMostRecentComments,
    removeObservation,
    removeUserAction,
    sortArrayByTimestamp
} from '../Helpers/FirebaseHelper';

export class ObservationComponent extends React.Component {
    constructor(props) {
        super(props);

        this._onPressMenuButton = this._onPressMenuButton.bind(this);
        this._onPressMenuDetailButton = this._onPressMenuDetailButton.bind(this);
        this._onPressLocationText = this._onPressLocationText.bind(this);
        this._onPressShareButton = this._onPressShareButton.bind(this);
        this._onPressProfile = this._onPressProfile.bind(this);
        this._onPressLikeButton = this._onPressLikeButton.bind(this);
        this._onPressCutleryButton = this._onPressCutleryButton.bind(this);
        this._addCommentToState = this._addCommentToState.bind(this);
        this._onPressMoreComments = this._onPressMoreComments.bind(this);
        this._onUpdate = this._onUpdate.bind(this);
        this._loadAdjectives = this._loadAdjectives.bind(this);

        this.state = {
            overlayIsHidden: true,
            liked: false,
            shared: false,
            cutleried: false,
            comments: [],
            newComment: '',
            observation: this.props.observation,
            user: this.props.user,
            adjectives: ''
        };

        getUserActions(this.state.observation.userid, this.state.observation.observationid, currentUser.uid)
            .then((actions) => {
                if (actions) {
                    this.setState({
                        liked: actions.likes,
                        shares: actions.shares,
                        cutleried: actions.cutleries,
                    });
                }
            }).catch((error) => {
                console.log(error);
            }
        );

        getXMostRecentComments(this.state.observation.userid, this.state.observation.observationid, 2)
            .then((comments) => {
                sortArrayByTimestamp(comments, true);
                if (comments.length > 1) {
                    this.setState({moreComments: true});
                    comments.splice(0,1);
                } else if (comments.length === 1) {
                    this.setState({comments: comments});
                }
            }).catch((error) => {
                console.log(error);
            }
        );

        if (!this.state.user) {
            getUser(this.state.observation.userid)
                .then((user) => {
                    this.setState({user: user});
                }).catch((error) => {
                    console.log(error);
                }
            );
        }
    }

    componentDidMount() {
        this._loadAdjectives();
    }

    _loadAdjectives() {
        let adjs = '';
        if (this.state.observation.vocabulary) {
            adjs = '';
            Object.keys(this.state.observation.vocabulary).map(index => {
                if (allVocabulary[index]) {
                    adjs += '#' + allVocabulary[index].value + ' ';
                }
            });
        }
        this.setState({adjectives: adjs});
    }

    _onPressLikeButton() {
        if (!currentUser || currentUser.isAnonymous) {
            // Do nothing
        } else {
            if (this.state.liked) {
                this._removeAction(ActivityEnum.LIKE);
            } else {
                console.log('Sending like...');
                this._sendAction(ActivityEnum.LIKE);
            }
        }
    }

    _onPressCutleryButton() {
        if (!currentUser || currentUser.isAnonymous) {
            // Do nothing
        } else {
            if (this.state.cutleried) {
                this._removeAction(ActivityEnum.CUTLERY);
            } else {
                console.log('Sending cutlery...');
                this._sendAction(ActivityEnum.CUTLERY);
            }
        }
    }

    _sendAction(type) {
        addUserAction(this.state.observation.userid, this.state.observation.observationid, type, currentUser.uid)
            .then(() => {
                this._updateActionState(type, true);
            }).catch((error) => {
                console.log(error);
            }
        );
    }

    _removeAction(type) {
        removeUserAction(this.state.observation.userid, this.state.observation.observationid, type, currentUser.uid)
            .then(() => {
                this._updateActionState(type, false);
            }).catch((error) => {
                console.log(error);
            }
        );
    }

    _updateActionState(type, value) {
        let obs = this.state.observation;
        if (type === ActivityEnum.LIKE) {
            if (!obs.likesCount) {
                obs.likesCount = 0;
            }

            if (value) {
                obs.likesCount += 1;
            } else {
                obs.likesCount -= 1;
            }

            this.setState({
                liked: value,
                observation: obs
            });
        } else if (type === ActivityEnum.SHARE) {
            if (!obs.sharesCount) {
                obs.sharesCount = 0;
            }

            if (value) {
                obs.sharesCount += 1;
            } else {
                obs.sharesCount -= 1;
            }

            this.setState({
                shared: value,
                observation: obs
            });
        } else if (type === ActivityEnum.CUTLERY) {
            if (!obs.cutleriesCount) {
                obs.cutleriesCount = 0;
            }

            if (value) {
                obs.cutleriesCount += 1;
            } else {
                obs.cutleriesCount -= 1;
            }

            this.setState({
                cutleried: value,
                observation: obs
            });
        }
    }

    _addCommentToState(comment) {
        const commentArray = [comment];
        let obs = this.state.observation;
        if (!obs.commentsCount) {
            obs.commentsCount = 0;
        }
        obs.commentsCount += 1;
        this.setState(prevState => ({
            comments: prevState.comments.concat(commentArray),
            observation: obs
        }));
    }

    _onPressLocationText() {
        this.props.navigation.navigate('Map', {observation: this.state.observation});
    }

    _onPressMenuButton() {
        const title = strings.selectAction;
        const message = strings.formatString(strings.doWithPost, String(this.state.observation.dishname), this.state.user.username);
        const options = [
            strings.edit,
            strings.delete,
            strings.cancel
        ];
        const cancelButtonIndex = 2;
        const destructiveButtonIndex = 1;

        if (Platform.OS === 'android') {
            Alert.alert(title, message,
                [
                    {text: strings.cancel, onPress: () => this._onPressMenuDetailButton(cancelButtonIndex), style: 'cancel'},
                    {text: strings.edit, onPress: () => this._onPressMenuDetailButton(0)},
                    {text: strings.delete, onPress: () => this._onPressMenuDetailButton(destructiveButtonIndex)},
                ]
            );
        } else if (Platform.OS === 'ios') {
            ActionSheetIOS.showActionSheetWithOptions({
                    title: title,
                    message: message,
                    options: options,
                    cancelButtonIndex: cancelButtonIndex,
                    destructiveButtonIndex: destructiveButtonIndex,
                },
                (buttonIndex) => {
                    this._onPressMenuDetailButton(buttonIndex);
                }
            );
        }
    }

    _onPressMenuDetailButton(buttonIndex) {
        if (buttonIndex === 0) {
            this.props.navigation.navigate('CreateObservation', {observation: this.state.observation, edit: true, onUpdate: this._onUpdate});
        } else if (buttonIndex === 1) {
            removeObservation(this.state.observation.userid, this.state.observation.observationid)
                .then(() => {
                    this.props.onDelete && this.props.onDelete(this.state.observation);
                }).catch(() => {
                    console.log(error);
                }
            );
        }
    }

    _onUpdate(newObservation) {
        this.setState({observation: newObservation}, () => this._loadAdjectives());
    }

    async _onPressShareButton() {
        if (!currentUser || currentUser.isAnonymous) {
            // Do nothing
        } else {
            this._sendAction(ActivityEnum.SHARE);
        }

        // TODO: What is being shared? Link?
        Share.open({
            title: strings.share,
            subject: strings.formatString(strings.shareSubject, appName),
            message: strings.formatString(strings.shareMessage, appName),
            dialogTitle: strings.shareDialogTitle,
            url: this.state.observation.imageUrl,
        }).catch(
            (err) => {
                err && console.log(err);
            }
        );
    }

    _toggleOverlay() {
        this.setState(previousState => {
            return { overlayIsHidden: !previousState.overlayIsHidden };
        });
    }

    _onPressProfile() {
        let params = {};
        params.user = {userid: this.state.observation.userid};
        navigateToScreen('Profile', this.props.navigation, params);
    }

    _onPressMoreComments() {
        let params = {};
        params.comments = this.state.comments;
        params.observation = this.state.observation;
        navigateToScreen('Comments', this.props.navigation, params);
    }

    _onCommentDelete(comment, index) {
        let comments = this.state.comments;
        if (index > -1) {
            comments.splice(index, 1);
        }
        let obs = this.state.observation;
        obs.commentsCount -= 1;
        this.setState({
            comments:comments,
            observation: obs
        });
    }

    _keyExtractor = (item) => item.timestamp + item.senderid;

    render() {
        const dietaryRestriction = this.state.observation.dietaryRestriction ? allDietaryRestrictions[this.state.observation.dietaryRestriction] : undefined;
        const notLoggedIn = !currentUser || currentUser.isAnonymous;

        return (
            <View name={'wrapper'} style={{flex:1}} >
                <View name={'header'} style={{flexDirection:'row'}}>
                    <View style={styles.containerPadding}>
                        <UserImageThumbnailComponent size={styles.roundProfile} onPress={this._onPressProfile} user={this.state.user}/>
                    </View>
                    <View name={'header'} style={[styles.containerPadding, {flex: 1, flexDirection:'column'}]}>
                        <View name={'header'} style={{flex: 1, flexDirection:'row'}}>
                            <Text name={'dishnames'} >
                                <Text name={'dishname'} style={styles.textTitleBoldDark}>{this.state.observation.dishname}</Text>
                                <Text name={'mypoc'} style={styles.textTitle}> ({this.state.observation.mypoccorrector || this.state.observation.mypoc})</Text>
                            </Text>
                        </View>
                        <View style={{flex:1, flexDirection:'row', justifyContent:'center', alignItems:'center'}}>
                            {
                                this.state.observation.homemade &&
                                <Image source={require('../Images/Homemade/homemade.png')} resizeMode={'cover'} style={{width: iconSizeSmall, height:iconSizeSmall, opacity: 0.3}}/>
                            }
                            {
                                !this.state.observation.homemade &&
                                <MaterialIcons name={iconEatingOut} size={iconSizeSmall} color={colorLight}/>
                            }
                            <Text name={'location'} style={[styles.textSmall, {flex: 1}]} onPress={this.state.observation.location && this._onPressLocationText}> {this.state.observation.location ? this.state.observation.location.name : (this.state.observation.homemade ? strings.homemade : strings.unknownLocation)}</Text>
                        </View>
                    </View>
                    {
                        currentUser && this.state.observation.userid === currentUser.uid &&
                        <TouchableOpacity name={'menubutton'} onPress={this._onPressMenuButton}>
                            <FontAwesome name={iconMenu} size={iconSizeStandard} color={colorContrast} style={styles.containerPadding}/>
                        </TouchableOpacity>
                    }
                </View>
                <View name={'picture'} style={{flexDirection:'row'}}>
                    <TouchableOpacity onPress={this._toggleOverlay.bind(this)} style={{flex: 1, aspectRatio: 1}}>
                        <CachedImage name={'image'} resizeMode={'cover'} source={this.state.observation.imageUrl ? {uri: this.state.observation.imageUrl} : require('../Images/noimage.jpg')} style={{flex: 1, aspectRatio: 1}}/>
                    </TouchableOpacity>
                    <View style={[{padding: 6, position: 'absolute', bottom: 0, left: 0, flexDirection:'row'}]}>
                        <View style={{flexDirection: 'row'}}>
                            {
                                this.state.observation.dietaryRestriction && this.state.observation.dietaryRestriction !== 'none' &&
                                <View name={'dietaryinfo'} style={[styles.leftRoundedEdges, styles.rightRoundedEdges, styles.containerPadding, {backgroundColor: colorMain, flexDirection: 'column', justifyContent: 'center'}]}>
                                    <Image source={(dietaryRestriction && dietaryRestriction.source) || require('../Images/DietaryRestrictions/none.png')} resizeMode={'cover'} style={{width: iconSizeStandard, height:iconSizeStandard, opacity: 0.7}}/>
                                </View>
                            }
                            {
                                this.state.observation.price && this.state.observation.currency &&
                                <View name={'price'} style={[styles.leftRoundedEdges, styles.rightRoundedEdges, styles.containerPadding, {backgroundColor:colorMain, flexDirection:'column', justifyContent:'center'}]}>
                                    {/*TODO [FEATURE]: Calculate price in currency of location or language*/}
                                    <Text style={[styles.textStandardDark]}>{allCurrencies[this.state.observation.currency].symbol}{this.state.observation.price}</Text>
                                </View>
                            }
                        </View>
                    </View>
                    <View style={[styles.containerOpacityDark, {padding: 6, position: 'absolute', bottom: 0, right: 0, flexDirection:'row'}]}>
                        <TouchableOpacity style={styles.containerPadding} onPress={this._onPressLikeButton} disabled={notLoggedIn}>
                            <FontAwesome name={iconLike} size={iconSizeStandard} color={notLoggedIn ? colorLight : (this.state.liked ? colorMain : colorBackground)}/>
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.containerPadding} onPress={this._onPressCutleryButton} disabled={notLoggedIn}>
                            <FontAwesome name={iconCutlery} size={iconSizeStandard} color={notLoggedIn ? colorLight : (this.state.cutleried ? colorMain : colorBackground)}/>
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.containerPadding} onPress={this._onPressShareButton} disabled={notLoggedIn}>
                            <FontAwesome name={iconShare} size={iconSizeStandard} color={notLoggedIn ? colorLight : (this.state.shared ? colorMain : colorBackground)}/>
                        </TouchableOpacity>
                    </View>
                    {
                        !this.state.overlayIsHidden &&
                        <ScrollView style={[styles.containerOpacityDark, {position: 'absolute', top: 0, left: 0, bottom: 0, right: 0}]} contentContainerStyle={{flexGrow: 1}}>
                            <TouchableOpacity name={'adjectivesoverlay'} onPress={this._toggleOverlay.bind(this)} style={{flex: 1, justifyContent: 'center', alignItems: 'center'}}>
                                <Text style={[styles.textLargeBoldLight, styles.containerPadding, {textAlign:'center'}]} adjustsFontSizeToFit={true} allowFontScaling={true}>{this.state.adjectives} </Text>
                            </TouchableOpacity>
                        </ScrollView>
                    }
                    <View name={'emojiwrapper'} style={{flexDirection:'row', position:'absolute', top:-smileySuperLargeFontSize/2, right:10, height: smileySuperLargeFontSize, width: smileySuperLargeFontSize}}>
                        <CachedImage name={'emoji'} resizeMode={'cover'} source={EmojiEnum[this.state.observation.rating]} style={{flex: 1, aspectRatio: 1}}/>
                    </View>
                </View>
                <View name={'details'} style={[styles.containerPadding, styles.bottomLine, {flexDirection:'row'}]}>
                    <View name={'description'} style={{flexDirection:'column', flex: 5}}>
                        <ReadMore
                            numberOfLines={2}
                            renderTruncatedFooter={(handlePressReadMore) =>
                                <View style={{position:'absolute', right:0, bottom:-0.2, flexDirection:'row'}}>
                                    <LinearGradient start={{x: 0, y: 1}} end={{x: 0.9, y: 1}} colors={[colorStandardBackground + '00', colorStandardBackground]} style={{width:30}}/>
                                    <Text style={[styles.textStandardDark, {backgroundColor: colorStandardBackground, color: colorAccent}]} onPress={handlePressReadMore}>
                                        {strings.readMore}
                                    </Text>
                                </View>
                            }
                            renderRevealedFooter={(handlePressReadLess) =>
                                <Text style={[styles.textStandardDark, {color: colorAccent}]} onPress={handlePressReadLess}>
                                    {strings.hide}
                                </Text>
                            }
                        >
                            <Text name={'description'} style={styles.textStandardDark}>{this.state.observation.description}</Text>
                        </ReadMore>
                        {/*TODO [FEATURE]: enable clicking on likes/cutleries to see who liked/cutleried/shared*/}
                        <View name={'information'} style={{flexDirection: 'row'}}>
                            <TimeAgo name={'time'} style={styles.textSmall} time={this.state.observation.timestamp}/>
                            <Text name={'details'} style={styles.textSmall}> • {formatNumberWithString(this.state.observation.likesCount, ActivityEnum.LIKE)} • {formatNumberWithString(this.state.observation.cutleriesCount, ActivityEnum.CUTLERY)} • {formatNumberWithString(this.state.observation.sharesCount, ActivityEnum.SHARE)} • {formatNumberWithString(this.state.observation.commentsCount, ActivityEnum.COMMENT)}</Text>
                        </View>
                    </View>
                </View>
                <FlatList
                    name={'comments'} style={{flex: 1, flexDirection:'column'}}
                    data={this.state.comments}
                    keyExtractor={this._keyExtractor}
                    renderItem={({item, index}) => <CommentComponent comment={item} {...this.props} onDelete={() => this._onCommentDelete(item, index)}/>}
                    removeClippedSubviews={true}
                    ListHeaderComponent={() =>
                        <View>
                            {this.state.moreComments && <TouchableOpacity onPress={this._onPressMoreComments}><Text style={[styles.textStandardBold, styles.containerPadding]}>{strings.viewMoreComments}</Text></TouchableOpacity>}
                        </View>
                    }
                />
                <View>
                    {(currentUser && !currentUser.isAnonymous) && <WriteCommentComponent observation={this.state.observation} onCommentAddedAction={this._addCommentToState} onWriteCommentPressed={this.props.onWriteCommentPressed}/>}
                </View>
            </View>
        );
    }
}
