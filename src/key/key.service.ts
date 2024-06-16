import { BadGatewayException, BadRequestException, Body, Headers, HttpException, HttpStatus, Injectable, Logger } from "@nestjs/common";
import { STATUS_CODES } from "http";
import { generateKeyDTO, updateDTO } from "src/key/key.dto";
import { PrismaService } from "src/prisma/prisma.service";
import * as jose from 'node-jose';
const jwkToPem = require('jwk-to-pem');


@Injectable()
export class KeyService {
    private readonly logger: Logger;
    constructor(private readonly prismaService: PrismaService) {
        this.logger = new Logger();
    }

    async retrieveAllKey() {
        try {
            const item = await this.prismaService.key.findMany();
            if (!item) {
                return {
                    success: false,
                    message: 'any key is not present',
                }
            } else {
                return {
                    success: true,
                    message: 'all keys retrieved',
                    data: item
                }
            }
        } catch (error) {
            this.logger.log('error happened from retrieving all key', error)
            HttpStatus.NOT_FOUND;
        }
    }
    async retrieveUniqueKey(uuid: string) {
        if (!uuid) {
            throw new BadGatewayException({
                success: false,
                message: 'uuid  is not given',
            })
        }
        const id = uuid
        try {
            const item = await this.prismaService.key.findUnique({ where: { id } })
            if (!item) {
                throw new HttpException(
                    'key does not exist with provided id',
                    HttpStatus.NOT_FOUND
                );
            }
            return {
                success : true,
                message: 'key id found',
                data : item
            }
        } catch (error) {
            this.logger.log('error happened from retrieve key section ', error)
            HttpStatus.INTERNAL_SERVER_ERROR;
        }
    }

    async updateKey(uuid: string, data: updateDTO) {
        if (!uuid) {
            throw new BadRequestException({
                success: false,
                message: 'pls provide uuid and name with request',
            })
        }
        const id = uuid;
        const key = await this.prismaService.key.findUnique({ where: { id } });

        if (!key) {
            throw new BadRequestException({
                success: false,
                message: 'pls provide a valid id or ID does not exist ',
            })
        }

        const name = data.name ? data.name : key.name


        const udpated_key = await this.prismaService.key.update({
            where: { id },
            data: {
                name
            }
        })
    }


    async deleteKey(uuid: string) {
        if (!uuid) {
            throw new BadRequestException({
                success: false,
                message: 'uuid is either not given or is invalid'
            })
        }
        const id = uuid
        const key = await this.prismaService.key.findUnique({ where: { id } })

        try {
            if (!key) {
                throw new HttpException(
                    'key does not exist with given id',
                    HttpStatus.NOT_FOUND
                )
            }
            const deleted_key = await this.prismaService.key.delete({ where: { id } })
            return {
                success: true,
                message: 'key deleted successfully'
            }
        } catch (error) {
            throw new BadRequestException({
                success: false,
                message: 'error while deleting a key',
            })
        }
    }
    async generateKey(uuid: string, key: generateKeyDTO) {
        if (!uuid) {
          throw new BadRequestException({
            success: false,
            message: 'uuid is either not given or is invalid',
          })
        }
        const { algorithm, name, length, issuer } = key;
        console.log(algorithm)
        const keyStore = jose.JWK.createKeyStore();
        const keyStore2 = jose.JWK.createKeyStore();
        const keyStore3 = jose.JWK.createKeyStore();
    
        try {
          if (algorithm === 'RS256') {
            await keyStore
              .generate('RSA', 2048, { alg: 'HS256', use: 'sig' })
              .then(() => {
                const rskey = JSON.stringify(keyStore.toJSON(true), null, 2);
                this.logger.log('RS key generated successfully');
              });
            const jwks = keyStore.toJSON(true);
            const publicKeyPem = jwkToPem(jwks.keys[0]);
            const privateKeyPem = jwkToPem(jwks.keys[0], { private: true });
            const key = await this.prismaService.key.create({
              data: {
                id: uuid,
                algorithm,
                name,
                issuer,
                kid: jwks.keys[0].kid,
                privateKey: privateKeyPem,
                publicKey: publicKeyPem,
                type: 'RS',
              },
            });
            this.logger.log(
              'RS key generated successfully',
              publicKeyPem,
              privateKeyPem,
            );
    
            return {
              success: true,
              message: 'key generated successfully',
              data: jwks,
            };
          } else if (algorithm === 'ES256') {
              await keyStore2
              .generate('EC', 'P-256', { alg: 'ES256', use: 'sig' })
              .then(() => {
                  const eckey = JSON.stringify(keyStore2.toJSON(true), null, 2);
                });
                const jwks = keyStore2.toJSON(true);
                console.log(jwks)
                const publicKeyPem = jwkToPem(jwks.keys[0]);
                const privateKeyPem = jwkToPem(jwks.keys[0], { private: true });
                const key = await this.prismaService.key.create({
              data: {
                id: uuid,
                algorithm,
                name,
                issuer,
                kid: jwks.keys[0].kid,
                privateKey: privateKeyPem,
                publicKey: publicKeyPem,
                type: 'EC',
            },
        });
            this.logger.log(
              'EC key generated successfully',
              publicKeyPem,
              privateKeyPem,
            );
    
            return {
              success: true,
              message: 'key generated successfully',
              data: jwks,
            };
          } else if (algorithm === 'HS256') {
            await keyStore3
              .generate('oct', 256, { alg: 'HS256', use: 'sig' })
              .then(() => {
                const hskey = JSON.stringify(keyStore3.toJSON(true), null, 2);
                this.logger.log('HS key generated successfully');
              });
            const jwks = keyStore3.toJSON(true);
            console.log(jwks);
            const key = await this.prismaService.key.create({
              data: {
                id: uuid,
                algorithm,
                name,
                issuer,
                kid: jwks.keys[0].kid,
                secret: jwks.keys[0].k,
                type: 'HS',
              },
            });
            this.logger.log('HS key generated successfully', jwks.keys[0].k);
            return {
              success: true,
              message: 'key generated successfully',
              data: jwks,
            };
          } else {
            throw new BadRequestException({
              success: false,
              message: 'Unknown algorithm provided',
            });
          }
        } catch (error) {
          this.logger.log('Error from generateKey', error);
          throw new BadRequestException({
            success: false,
            message: 'error while generating key',
          });
        }
      }

}