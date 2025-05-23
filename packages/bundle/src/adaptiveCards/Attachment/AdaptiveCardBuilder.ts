import {
  Column,
  ColumnSet,
  Container,
  Image,
  OpenUrlAction,
  Size,
  SizeAndUnit,
  SizeUnit,
  SubmitAction,
  TextBlock,
  TextColor,
  TextSize,
  TextWeight,
  type AdaptiveCard,
  type CardElement
} from 'adaptivecards';
import type { DirectLineCardAction } from 'botframework-webchat-core';
import { isForbiddenPropertyName } from 'botframework-webchat-core';

import { type AdaptiveCardsPackage } from '../../types/AdaptiveCardsPackage';
import { type AdaptiveCardsStyleOptions } from '../AdaptiveCardsStyleOptions';

export interface BotFrameworkCardAction {
  __isBotFrameworkCardAction: true;
  cardAction: DirectLineCardAction;
}

function addCardAction(cardAction: DirectLineCardAction, includesOAuthButtons?: boolean) {
  const { type } = cardAction;
  let action;

  if (
    type === 'imBack' ||
    type === 'messageBack' ||
    type === 'postBack' ||
    (type === 'signin' && includesOAuthButtons)
  ) {
    action = new SubmitAction();

    action.data = {
      __isBotFrameworkCardAction: true,
      cardAction
    };

    action.title = (cardAction as { title: string }).title;
  } else {
    action = new OpenUrlAction();

    action.title = (cardAction as { title: string }).title;
    action.url = cardAction.type === 'call' ? `tel:${cardAction.value}` : cardAction.value;
  }

  return action;
}

export default class AdaptiveCardBuilder {
  card: AdaptiveCard;
  container: Container;
  styleOptions: AdaptiveCardsStyleOptions;

  constructor(
    adaptiveCards: AdaptiveCardsPackage,
    styleOptions: AdaptiveCardsStyleOptions,
    direction: 'ltr' | 'rtl' | 'auto' = 'ltr'
  ) {
    this.card = new adaptiveCards.AdaptiveCard();
    this.container = new Container();
    this.container.rtl = direction === 'rtl';
    this.styleOptions = styleOptions;

    this.card.addItem(this.container);
  }

  addColumnSet(sizes: number[], container: Container = this.container, selectAction?: DirectLineCardAction) {
    const columnSet = new ColumnSet();

    columnSet.selectAction = selectAction && addCardAction(selectAction);
    container.addItem(columnSet);

    return sizes.map(size => {
      const column = new Column();

      column.width = new SizeAndUnit(size, SizeUnit.Weight);

      columnSet.addColumn(column);

      return column;
    });
  }

  addItems(cardElements: CardElement[], container: Container = this.container) {
    cardElements.forEach(cardElement => container.addItem(cardElement));
  }

  addTextBlock(text: string, template: Partial<TextBlock>, container: Container = this.container) {
    if (typeof text !== 'undefined') {
      const textblock = new TextBlock();

      for (const prop in template) {
        if (!isForbiddenPropertyName(prop)) {
          // Mitigated through denylisting.
          // eslint-disable-next-line security/detect-object-injection
          textblock[prop] = template[prop];
        }
      }

      textblock.text = text;

      container.addItem(textblock);
    }
  }

  addButtons(cardActions: readonly Readonly<DirectLineCardAction>[], includesOAuthButtons?: boolean) {
    cardActions &&
      cardActions.forEach(cardAction => {
        this.card.addAction(addCardAction(cardAction, includesOAuthButtons));
      });
  }

  addCommonHeaders(content: ICommonContent) {
    const { richCardWrapTitle } = this.styleOptions;
    this.addTextBlock(content.title, {
      color: TextColor.Default,
      size: TextSize.Medium,
      style: 'heading',
      weight: TextWeight.Bolder,
      wrap: richCardWrapTitle
    });
    this.addTextBlock(content.subtitle, { color: TextColor.Default, isSubtle: true, wrap: richCardWrapTitle });
    this.addTextBlock(content.text, { color: TextColor.Default, wrap: true });
  }

  addCommon(content: ICommonContent) {
    this.addCommonHeaders(content);
    this.addButtons(content.buttons);
  }

  addImage(url: string, container?: Container, selectAction?: Readonly<DirectLineCardAction>, altText?: string) {
    container = container || this.container;

    const image = new Image();

    image.altText = altText;
    image.url = url;
    image.selectAction = selectAction && addCardAction(selectAction);
    image.size = Size.Stretch;

    container.addItem(image);
  }
}

export interface ICommonContent {
  buttons?: readonly Readonly<DirectLineCardAction>[];
  subtitle?: string;
  text?: string;
  title?: string;
}
