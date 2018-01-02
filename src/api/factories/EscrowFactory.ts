import * as _ from 'lodash';
import { inject, named } from 'inversify';
import { Logger as LoggerType } from '../../core/Logger';
import { Types, Core, Targets } from '../../constants';
import { validate, request } from '../../core/api/Validate';
import { Escrow } from '../models/Escrow';
import { EscrowMessageInterface } from '../messages/EscrowMessageInterface';
import { EscrowMessage } from '../messages/EscrowMessage';

export class EscrowFactory {

    public log: LoggerType;

    constructor(
        @inject(Types.Core) @named(Core.Logger) public Logger: typeof LoggerType
    ) {
        this.log = new Logger(__filename);
    }


    /**
     * Factory will return message as per the escrow action for broadcasting.
     * data:
     * escrow: object
     * address: object
     * listing: string
     * nonce: string
     * memo: string
     *
     * @param data
     * @returns {EscrowMessageInterface}
     */
    @validate()
    public get(data: EscrowMessage): EscrowMessageInterface {
        let message;
        switch (data.action) {
            case 'MPA_LOCK':
                const address: any = data.address;
                message = {
                    version: '0.0.1.0',
                    mpaction: [
                        {
                            action: 'MPA_LOCK',
                            listing: data.listing,
                            nonce: data.nonce,
                            info: {
                                address: address['addressLine1'] + address['addressLine2'],
                                memo: data.memo
                            },
                            escrow: {
                                rawtx: '....'
                            }
                        }
                    ]
                };
                break;
            case 'MPA_RELEASE':
                message = {
                    version: '0.0.1.0',
                    mpaction: {
                        action: 'MPA_RELEASE',
                        item: data.listing,
                        memo: data.memo,
                        escrow: {
                            type: 'release',
                            rawtx: `The buyer sends the half signed rawtx which releases the escrow and paymeny.
                            The vendor then recreates the whole transaction
                            (check ouputs, inputs, scriptsigs and the fee), verifying that buyer\'s rawtx is indeed legitimate.
                            The vendor then signs the rawtx and broadcasts it.`
                        }
                    }
                };
                break;
            case 'MPA_REFUND':
                message = {
                    version: '0.0.1.0',
                    mpaction: {
                        action: 'MPA_REFUND',
                        item: data.listing,
                        accepted: data.accepted,
                        memo: data.memo,
                        escrow: {
                            type: 'refund',
                            rawtx: `The vendor decodes the rawtx from MP_REQUEST_REFUND
                            and recreates the whole transaction (check ouputs, inputs, scriptsigs and the fee),
                            verifying that buyer\'s rawtx is indeed legitimate.
                            The vendor then signs the rawtx and sends it to the buyer. The vendor can decide to broadcast it himself.`
                        }
                    }
                };
                break;
        }
        return message as EscrowMessageInterface;
    }
}
