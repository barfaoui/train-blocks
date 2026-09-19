import type { SportType } from '@common/planner-types';

import AmericanFootballIcon from '../../assets/sports/american-football.svg';
import ArcheryIcon from '../../assets/sports/archery.svg';
import BadmintonIcon from '../../assets/sports/badminton.svg';
import BaseballIcon from '../../assets/sports/baseball.svg';
import BasketballIcon from '../../assets/sports/basketball.svg';
import BoxingIcon from '../../assets/sports/boxing.svg';
import ClimbingIcon from '../../assets/sports/climbing.svg';
import CrossCountrySkiingIcon from '../../assets/sports/cross-country-skiing.svg';
import CrossfitIcon from '../../assets/sports/crossfit.svg';
import CyclingIcon from '../../assets/sports/cycling.svg';
import DanceIcon from '../../assets/sports/dance.svg';
import FencingIcon from '../../assets/sports/fencing.svg';
import FootballIcon from '../../assets/sports/football.svg';
import GolfIcon from '../../assets/sports/golf.svg';
import GymnasticsIcon from '../../assets/sports/gymnastics.svg';
import HandballIcon from '../../assets/sports/handball.svg';
import HikingIcon from '../../assets/sports/hiking.svg';
import HockeyIcon from '../../assets/sports/hockey.svg';
import HorsebackRidingIcon from '../../assets/sports/horseback-riding.svg';
import IceSkatingIcon from '../../assets/sports/ice-skating.svg';
import JumpRopeIcon from '../../assets/sports/jump-rope.svg';
import KayakingIcon from '../../assets/sports/kayaking.svg';
import MartialArtsIcon from '../../assets/sports/martial-arts.svg';
import MountainBikingIcon from '../../assets/sports/mountain-biking.svg';
import OtherIcon from '../../assets/sports/other.svg';
import PilatesIcon from '../../assets/sports/pilates.svg';
import RollerSkatingIcon from '../../assets/sports/roller-skating.svg';
import RowingIcon from '../../assets/sports/rowing.svg';
import RugbyIcon from '../../assets/sports/rugby.svg';
import RunningIcon from '../../assets/sports/running.svg';
import SailingIcon from '../../assets/sports/sailing.svg';
import SkateboardingIcon from '../../assets/sports/skateboarding.svg';
import SkiingIcon from '../../assets/sports/skiing.svg';
import SnowboardingIcon from '../../assets/sports/snowboarding.svg';
import StrengthIcon from '../../assets/sports/strength.svg';
import StretchingIcon from '../../assets/sports/stretching.svg';
import SurfingIcon from '../../assets/sports/surfing.svg';
import SwimmingIcon from '../../assets/sports/swimming.svg';
import TableTennisIcon from '../../assets/sports/table-tennis.svg';
import TennisIcon from '../../assets/sports/tennis.svg';
import TrailRunningIcon from '../../assets/sports/trail-running.svg';
import TreadmillIcon from '../../assets/sports/treadmill.svg';
import VolleyballIcon from '../../assets/sports/volleyball.svg';
import WalkingIcon from '../../assets/sports/walking.svg';
import YogaIcon from '../../assets/sports/yoga.svg';

export type SportTypeInfo = {
  label: string;
  // URL of an SVG in assets/sports; swap the file to change the icon.
  icon: string;
};

// Keyed by SportType so adding a sport type without an entry here fails to compile.
export const SPORT_TYPE_INFO: Record<SportType, SportTypeInfo> = {
  RUNNING: { label: 'Running', icon: RunningIcon },
  TRAIL_RUNNING: { label: 'Trail running', icon: TrailRunningIcon },
  TREADMILL: { label: 'Treadmill', icon: TreadmillIcon },
  WALKING: { label: 'Walking', icon: WalkingIcon },
  HIKING: { label: 'Hiking', icon: HikingIcon },
  CYCLING: { label: 'Cycling', icon: CyclingIcon },
  MOUNTAIN_BIKING: { label: 'Mountain biking', icon: MountainBikingIcon },
  SWIMMING: { label: 'Swimming', icon: SwimmingIcon },
  ROWING: { label: 'Rowing', icon: RowingIcon },
  KAYAKING: { label: 'Kayaking', icon: KayakingIcon },
  SAILING: { label: 'Sailing', icon: SailingIcon },
  SURFING: { label: 'Surfing', icon: SurfingIcon },
  STRENGTH: { label: 'Strength', icon: StrengthIcon },
  CROSSFIT: { label: 'CrossFit', icon: CrossfitIcon },
  GYMNASTICS: { label: 'Gymnastics', icon: GymnasticsIcon },
  YOGA: { label: 'Yoga', icon: YogaIcon },
  PILATES: { label: 'Pilates', icon: PilatesIcon },
  STRETCHING: { label: 'Stretching', icon: StretchingIcon },
  JUMP_ROPE: { label: 'Jump rope', icon: JumpRopeIcon },
  CLIMBING: { label: 'Climbing', icon: ClimbingIcon },
  CROSS_COUNTRY_SKIING: { label: 'Cross country skiing', icon: CrossCountrySkiingIcon },
  SKIING: { label: 'Skiing', icon: SkiingIcon },
  SNOWBOARDING: { label: 'Snowboarding', icon: SnowboardingIcon },
  ICE_SKATING: { label: 'Ice skating', icon: IceSkatingIcon },
  ROLLER_SKATING: { label: 'Roller skating', icon: RollerSkatingIcon },
  SKATEBOARDING: { label: 'Skateboarding', icon: SkateboardingIcon },
  TENNIS: { label: 'Tennis', icon: TennisIcon },
  BADMINTON: { label: 'Badminton', icon: BadmintonIcon },
  TABLE_TENNIS: { label: 'Table tennis', icon: TableTennisIcon },
  FOOTBALL: { label: 'Football', icon: FootballIcon },
  BASKETBALL: { label: 'Basketball', icon: BasketballIcon },
  VOLLEYBALL: { label: 'Volleyball', icon: VolleyballIcon },
  HANDBALL: { label: 'Handball', icon: HandballIcon },
  RUGBY: { label: 'Rugby', icon: RugbyIcon },
  AMERICAN_FOOTBALL: { label: 'American football', icon: AmericanFootballIcon },
  BASEBALL: { label: 'Baseball', icon: BaseballIcon },
  HOCKEY: { label: 'Hockey', icon: HockeyIcon },
  GOLF: { label: 'Golf', icon: GolfIcon },
  BOXING: { label: 'Boxing', icon: BoxingIcon },
  MARTIAL_ARTS: { label: 'Martial arts', icon: MartialArtsIcon },
  DANCE: { label: 'Dance', icon: DanceIcon },
  HORSEBACK_RIDING: { label: 'Horseback riding', icon: HorsebackRidingIcon },
  ARCHERY: { label: 'Archery', icon: ArcheryIcon },
  FENCING: { label: 'Fencing', icon: FencingIcon },
  OTHER: { label: 'Other', icon: OtherIcon },
};
