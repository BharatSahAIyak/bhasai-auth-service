import { HttpException, HttpStatus, Injectable, Logger } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { RoleDto, UpdateRoleDto } from 'src/dto/application.dto';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class ApplicationRolesService {
  private readonly logger: Logger;
  constructor(private readonly prismaService: PrismaService) {
    this.logger = new Logger();
  }

  async createRole(data: RoleDto, applicationsId: string, roleId?: string) {
    const application = await this.prismaService.application.findUnique({
      where: { id: applicationsId },
    });
    if (!application) {
      throw new HttpException(
        'Application with provided application id dont exists',
        HttpStatus.BAD_REQUEST,
      );
    }
    const { description, name, isDefault, isSuperRole } = data;
    const id = data.id ? data.id : roleId ? roleId : randomUUID();
    try {
      const newRole = await this.prismaService.applicationRole.create({
        data: {
          id,
          description,
          name,
          isDefault,
          isSuperRole,
          applicationsId,
        },
      });
      this.logger.log('New role added!', newRole);
      return {
        message: 'successfully created a new role',
        role: newRole,
        applicationsId,
      };
    } catch (error) {
      this.logger.log('Error creating a new Role', error);
      return {
        message: 'error creating the role',
        role: data,
      };
    }
  }

  async getRole() {}

  async updateRole(id: string, roleId: string, data: UpdateRoleDto) {
    if (!data) {
      throw new HttpException('No updation data given', HttpStatus.BAD_REQUEST);
    }
    const application = await this.prismaService.application.findUnique({
      where: { id },
    });
    if (!application) {
      throw new HttpException(
        "Application with given id don't exist",
        HttpStatus.BAD_REQUEST,
      );
    }
    try {
      const role = await this.prismaService.applicationRole.update({
        where: { id: roleId, applicationsId: id },
        data: {
          ...data,
        },
      });
      this.logger.log('Role updated', role);
      return {
        message: 'role updated successfully',
        role,
      };
    } catch (error) {
      console.log('Error occured while updating role', error);
      throw new HttpException(
        'Error while updating role',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async deleteRole(id: string, roleId: string) {
    return await this.prismaService.applicationRole.delete({
      where: {
        id: roleId,
        applicationsId: id,
      },
    });
  }
}