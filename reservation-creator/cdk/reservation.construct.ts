import { Construct } from 'constructs';
import { NodejsFunction } from 'aws-cdk-lib/aws-lambda-nodejs';
import { Code, LayerVersion } from 'aws-cdk-lib/aws-lambda';
import { TableV2, AttributeType } from 'aws-cdk-lib/aws-dynamodb';
import * as ses from 'aws-cdk-lib/aws-ses';
import { Lambda } from 'aws-cdk-lib/aws-ses-actions';

export class ReservationConstruct extends Construct {
  constructor(scope: Construct, id: string) {
    super(scope, id);

    const chromiumLayer = LayerVersion.fromLayerVersionArn(
      this,
      'chromium-lambda-layer',
      'arn:aws:lambda:us-east-1:764866452798:layer:chrome-aws-lambda:45'
    );
    const reservationFunction = new NodejsFunction(this, 'createReservation', {
      functionName: 'CreateReservation',
      code: Code.fromAsset('lambda'),
      handler: 'createReservation.handler',
      memorySize: 1024,
      bundling: {
        externalModules: ['@sparticuz/chromium']
      },
      layers: [chromiumLayer]
    });

    const reservationFromNotificationFunction = new NodejsFunction(
      this,
      'createReservationFromNotification',
      {
        functionName: 'CreateReservationFromNotification',
        code: Code.fromAsset('lambda'),
        handler: 'createReservationFromNotification.handler',
        memorySize: 1024,
        bundling: {
          externalModules: ['@sparticuz/chromium']
        },
        layers: [chromiumLayer]
      }
    );

    const table = new TableV2(this, 'ReservationConfigTable', {
      partitionKey: { name: 'id', type: AttributeType.STRING }
    });

    table.grantReadWriteData(reservationFunction);
    table.grantReadWriteData(reservationFromNotificationFunction);

    new ses.ReceiptRuleSet(this, 'RuleSet', {
      rules: [
        {
          actions: [
            new Lambda({
              function: reservationFromNotificationFunction
            })
          ]
        }
      ]
    });
  }
}
